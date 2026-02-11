import { API_ENDPOINTS } from '../constants';
import { retryWithNetworkCheck } from '../utils/network';
import { callApi, ApiResponse } from './apiClient';
import { NotificationsResponse } from '../types/notification/notification';

class NotificationService {
  private baseUrl = API_ENDPOINTS.BASE_URL;

  async getNotifications(page: number = 1, limit: number = 20): Promise<ApiResponse<NotificationsResponse>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.NOTIFICATIONS}?page=${page}&limit=${limit}`;

    const apiCall = async () => {
      return await callApi<NotificationsResponse>({
        url,
        method: 'GET',
        headerToken: true
      });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }
}

export const notificationService = new NotificationService();

