import CustomToast from '../components/CustomToast';
import { API_HEADERS, COLORS, HTTP_METHODS } from '../constants';

export interface ApiOptions {
  url: string;
  method?: string;
  body?: object;
  headers?: Record<string, string>;
  timeout?: number;
  handleSessionExpired?: () => void;
}

function showToast(msg: string = 'Unknown error') {
  CustomToast.show({
    msg,
    bgColor: COLORS.ERROR,
    textColor: COLORS.WHITE,
  });
}

export async function callApi<T>({
  url,
  method = HTTP_METHODS.POST,
  body,
  headers = API_HEADERS.JSON,
  timeout = 10000,
  handleSessionExpired,
}: ApiOptions): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (response.ok) {
      if (data.status === false || data.status === 'false') {
        showToast(data.message || 'Operation failed');
      }
      return data as T;
    }

    // Handle specific HTTP errors
    const msg = data?.message;

    switch (response.status) {
      case 400:
      case 401:
      case 404:
      case 500:
        showToast(msg);
        break;
      case 403:
        showToast(msg || 'Forbidden / Session expired');
        if (handleSessionExpired) handleSessionExpired();
        break;
      default:
        showToast(`HTTP ${response.status}: ${response.statusText}`);
    }

    throw new Error(msg || `HTTP ${response.status}`);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      showToast('Request timed out');
      throw new Error('Request timed out');
    }

    showToast(error?.message || 'Network error');
    throw error;
  }
}
