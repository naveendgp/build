import { API_HEADERS, HTTP_METHODS } from '../constants';
import { useAuthStore } from '../state/zustand/authStore';
import { handleSessionExpired } from '../utils/sessionHandler';

/**
 * ================================
 * TYPES
 * ================================
 */
export interface ApiOptions {
  url: string;
  method?: string;
  body?: object;
  headers?: Record<string, string>;
  timeout?: number;
  headerToken?: boolean;

  /**
   * Client-level controls
   * Defaults are SAFE for high-frequency APIs
   */
  abortable?: boolean;   // default: false
  retryable?: boolean;   // default: false
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  message?: string;
}

/**
 * ================================
 * INTERNAL STATE (CLIENT ONLY)
 * ================================
 */

// Prevent duplicate requests (across screens)
const inFlightRequests = new Map<string, Promise<ApiResponse>>();

// Prevent stale responses from updating UI
const requestVersionMap = new Map<string, number>();

const SHOULD_RETRY_STATUS = [0, 408, 500, 502, 503];

/**
 * ================================
 * API CLIENT
 * ================================
 */
export async function callApi<T = any>({
  url,
  method = HTTP_METHODS.POST,
  body,
  headers = API_HEADERS.JSON,
  timeout = 20000,
  headerToken = true,

  // SAFE DEFAULTS
  abortable = false,
  retryable = false,
}: ApiOptions): Promise<ApiResponse<T>> {

  const requestKey = `${method}:${url}:${JSON.stringify(body ?? {})}`;

  // -------------------------------
  // Request de-duplication
  // -------------------------------
  if (!abortable && inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const controller = abortable ? new AbortController() : null;
  const timeoutId = abortable
    ? setTimeout(() => controller?.abort(), timeout)
    : null;

  // Track request version (stale protection)
  const version = (requestVersionMap.get(url) ?? 0) + 1;
  requestVersionMap.set(url, version);

  const requestPromise = (async (): Promise<ApiResponse<T>> => {
    try {
      // -------------------------------
      // Headers
      // -------------------------------
      const requestHeaders: Record<string, string> = { ...headers };

      if (headerToken !== false) {
        const token = useAuthStore.getState().token;
        if (token) {
          requestHeaders.authorization = `Bearer ${token}`;
        }
      } else {
        delete requestHeaders.authorization;
      }

      console.log(`API → ${method} ${url}`, body ?? '');

      // -------------------------------
      // Fetch
      // -------------------------------
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller?.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      console.log(`API ← ${url}`, data);

      // -------------------------------
      // Ignore stale responses
      // -------------------------------
      if (requestVersionMap.get(url) !== version) {
        return {
          success: false,
          statusCode: 204,
          error: 'Stale response',
        };
      }

      // -------------------------------
      // SUCCESS
      // -------------------------------
      if (response.status === 200 || response.status === 201) {
        if (data?.status === false || data?.status === 'false') {
          return {
            success: false,
            error: data?.message || 'Operation failed',
            statusCode: response.status,
            message: data?.message,
          };
        }

        return {
          success: true,
          data: data as T,
          statusCode: response.status,
          message: data?.message || 'Success',
        };
      }

      // -------------------------------
      // HTTP ERRORS
      // -------------------------------
      let errorMessage = data?.message || 'Something went wrong';
      let userMessage = errorMessage;

      switch (response.status) {
        case 401:
          userMessage = 'Session expired';
          try {
            useAuthStore.getState().handle401Error?.();
            handleSessionExpired?.();
          } catch { }
          break;

        case 403:
          handleSessionExpired?.();
          break;
      }

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
        message: userMessage,
      };

    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);

      // -------------------------------
      // Abort is NOT network error
      // -------------------------------
      if (error?.name === 'AbortError') {
        return {
          success: false,
          statusCode: 499,
          error: 'Request cancelled',
          message: 'Request cancelled',
        };
      }

      // -------------------------------
      // Real network failure
      // -------------------------------
      if (
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('fetch')
      ) {
        return {
          success: false,
          statusCode: 0,
          error: 'Network error',
          message: 'Please check your internet connection',
        };
      }

      return {
        success: false,
        statusCode: 0,
        error: error?.message || 'Unknown error',
        message: 'Something went wrong',
      };
    } finally {
      inFlightRequests.delete(requestKey);
    }
  })();

  inFlightRequests.set(requestKey, requestPromise);

  const response = await requestPromise;

  // -------------------------------
  // Retry logic (client-controlled)
  // -------------------------------
  if (
    retryable &&
    response.statusCode &&
    SHOULD_RETRY_STATUS.includes(response.statusCode)
  ) {
    console.warn('Retrying API:', url);
    return callApi({ url, method, body, headers, timeout, headerToken, abortable, retryable });
  }

  return response;
}
