import { ApiResponse } from '../interfaces/api-response.interface';

export class ResponseHelper {
  static success<T = any>(message: string, data: T | null = null): ApiResponse<T> {
    return {
      status: true,
      data,
      message,
    };
  }

  static error(message: string, data: any = null): ApiResponse {
    return {
      status: false,
      data,
      message,
    };
  }
}