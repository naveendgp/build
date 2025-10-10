import { useAuthStore } from '../store/useAuthStore';

export interface ApiConfig {
  baseUrl: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export class ApiService {
  private static getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private static async handleRequest<T>(config: ApiConfig): Promise<T> {
    const { baseUrl, endpoint, method, headers = {}, body } = config;
    const fullUrl = `${baseUrl}${endpoint}`;
    const authHeaders = this.getAuthHeaders();

    console.log('API Request:', {
      baseUrl,
      endpoint,
      method,
      headers: { ...authHeaders, ...headers },
      body,
      fullUrl,
    });

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: { ...authHeaders, ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static async get<T>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.handleRequest<T>({
      baseUrl: 'http://13.204.157.24:3000',
      endpoint,
      method: 'GET',
      headers,
    });
  }

  static async post<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.handleRequest<T>({
      baseUrl: 'http://13.204.157.24:3000',
      endpoint,
      method: 'POST',
      headers,
      body,
    });
  }

  static async put<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.handleRequest<T>({
      baseUrl: 'http://13.204.157.24:3000',
      endpoint,
      method: 'PUT',
      headers,
      body,
    });
  }

  static async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.handleRequest<T>({
      baseUrl: 'http://13.204.157.24:3000',
      endpoint,
      method: 'DELETE',
      headers,
    });
  }
}
