import { API_ENDPOINTS } from '../constants';
import { retryWithNetworkCheck } from '../utils/network';
import { callApi, ApiResponse } from './apiClient';
import { OrdersHistoryResponse, OrderDetailResponse, Order } from '../types/order/order';

class OrdersHistoryService {
    private baseUrl = API_ENDPOINTS.BASE_URL;

    async getOrdersHistory(page: number = 1, limit: number = 10): Promise<ApiResponse<OrdersHistoryResponse>> {
        const url = `${this.baseUrl}${API_ENDPOINTS.ORDERS}?page=${page}&limit=${limit}`;

        const apiCall = async () => {
            return await callApi<OrdersHistoryResponse>({
                url,
                method: 'GET',
                headerToken: true
            });
        };

        return retryWithNetworkCheck(apiCall, 3, 2000);
    }

    // Helper method to extract orders data safely
    extractOrdersData(response: ApiResponse<OrdersHistoryResponse>): OrdersHistoryResponse['data'] | null {
        if (!response.success || !response.data?.data) {
            return null;
        }
        return response.data.data;
    }

    // Helper method to validate orders response
    validateOrdersResponse(response: ApiResponse<OrdersHistoryResponse>): boolean {
        if (!response.success || !response.data?.data) {
            return false;
        }
        return Array.isArray(response.data.data.orders);
    }

    async getOrderById(orderId: string): Promise<ApiResponse<OrderDetailResponse>> {
        if (!orderId || orderId.trim() === '') {
            return {
                success: false,
                error: 'Order ID is required',
                statusCode: 400,
                message: 'Please provide a valid order ID'
            };
        }

        const url = `${this.baseUrl}${API_ENDPOINTS.ORDER_DETAIL}/${orderId}`;

        const apiCall = async () => {
            return await callApi<OrderDetailResponse>({
                url,
                method: 'GET',
                headerToken: true
            });
        };

        return retryWithNetworkCheck(apiCall, 3, 2000);
    }

    // Helper method to extract order detail data safely
    extractOrderDetailData(response: ApiResponse<OrderDetailResponse>): Order | null {
        if (!response.success || !response.data?.data?.order) {
            return null;
        }
        return response.data.data.order;
    }

    // Helper method to validate order detail response
    validateOrderDetailResponse(response: ApiResponse<OrderDetailResponse>): boolean {
        if (!response.success || !response.data?.data?.order) {
            return false;
        }
        return !!response.data.data.order._id;
    }
}

export const ordersHistoryService = new OrdersHistoryService();

