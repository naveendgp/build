import { API_ENDPOINTS } from '../constants';
import { retryWithNetworkCheck } from '../utils/network';
import { callApi, ApiResponse } from './apiClient';
import { PlaceOrderRequest, PlaceOrderResponse, OrderPreviewRequest, OrderPreviewResponse, OrderPreview, MakePaymentRequest, MakePaymentResponse, CreateReviewRequest, CreateReviewResponse, ChangePaymentMethodRequest, ChangePaymentMethodResponse } from '../types/order/order';

class OrderService {
    private baseUrl = API_ENDPOINTS.BASE_URL;

    async placeOrder(orderData: PlaceOrderRequest): Promise<ApiResponse<PlaceOrderResponse>> {
        // Validate required fields
        if (!orderData.pickup_address_id || orderData.pickup_address_id.trim() === '') {
            return {
                success: false,
                error: 'Pickup address ID is required',
                statusCode: 400,
                message: 'Please select a pickup address'
            };
        }

        if (!orderData.vendor_id || orderData.vendor_id.trim() === '') {
            return {
                success: false,
                error: 'Vendor ID is required',
                statusCode: 400,
                message: 'Vendor information is missing'
            };
        }

        if (!orderData.service_items || orderData.service_items.length === 0) {
            return {
                success: false,
                error: 'Service items are required',
                statusCode: 400,
                message: 'Please add at least one service item'
            };
        }

        const url = `${this.baseUrl}${API_ENDPOINTS.PLACE_ORDER}`;

        const apiCall = async () => {
            return await callApi<PlaceOrderResponse>({
                url,
                method: 'POST',
                body: orderData,
                headerToken: true
            });
        };

        return retryWithNetworkCheck(apiCall, 3, 2000);
    }

    // Helper method to extract order data safely
    extractOrderData(response: ApiResponse<PlaceOrderResponse>): PlaceOrderResponse | null {
        if (!response.success || !response.data) {
            return null;
        }
        return response.data;
    }

    // Helper method to validate order response
    validateOrderResponse(order: PlaceOrderResponse | null): boolean {
        if (!order) return false;
        // Add validation logic based on your API response structure
        // For now, just check if order exists
        return true;
    }

    async getOrderPreview(previewData: OrderPreviewRequest): Promise<ApiResponse<OrderPreviewResponse>> {
        // Validate required fields
        if (!previewData.pickup_address_id || previewData.pickup_address_id.trim() === '') {
            return {
                success: false,
                error: 'Pickup address ID is required',
                statusCode: 400,
                message: 'Please select a pickup address'
            };
        }

        if (!previewData.vendor_id || previewData.vendor_id.trim() === '') {
            return {
                success: false,
                error: 'Vendor ID is required',
                statusCode: 400,
                message: 'Vendor information is missing'
            };
        }

        if (!previewData.service_items || previewData.service_items.length === 0) {
            return {
                success: false,
                error: 'Service items are required',
                statusCode: 400,
                message: 'Please add at least one service item'
            };
        }

        const url = `${this.baseUrl}${API_ENDPOINTS.ORDER_PREVIEW}`;

        const apiCall = async () => {
            const response = await callApi<OrderPreviewResponse>({
                url,
                method: 'POST',
                body: previewData,
                headerToken: true
            });

            // If request timed out or network error, throw to trigger retry
            if (!response.success && (response.statusCode === 408 || response.statusCode === 0)) {
                throw new Error(`Network request failed: ${response.error || 'Unknown network error'}`);
            }

            return response;
        };

        return retryWithNetworkCheck(apiCall, 3, 2000);
    }

    // Helper method to extract preview data safely
    extractPreviewData(response: ApiResponse<OrderPreviewResponse>): OrderPreview | null {
        if (!response.success || !response.data?.data?.order_preview) {
            return null;
        }
        return response.data.data.order_preview;
    }

    // Helper method to validate preview response
    validatePreviewResponse(preview: OrderPreview | null): boolean {
        if (!preview) return false;
        // Validate required fields
        return !!(preview.vendor && preview.vendor.pickup_address && preview.vendor.items && preview.vendor.pricing);
    }

    async cancelOrder(orderId: string): Promise<ApiResponse<any>> {
        if (!orderId || orderId.trim() === '') {
            return {
                success: false,
                error: 'Order ID is required',
                statusCode: 400,
                message: 'Please provide a valid order ID'
            };
        }

        const url = `${this.baseUrl}${API_ENDPOINTS.CANCEL_ORDER}/${orderId}`;

        const apiCall = async () => {
            return await callApi<any>({
                url,
                method: 'GET',
                headerToken: true
            });
        };

        return retryWithNetworkCheck(apiCall, 3, 2000);
    }

    async makePayment(orderId: string): Promise<ApiResponse<MakePaymentResponse>> {
        if (!orderId || orderId.trim() === '') {
            return {
                success: false,
                error: 'Order ID is required',
                statusCode: 400,
                message: 'Please provide a valid order ID'
            };
        }

        const requestBody: MakePaymentRequest = {
            order_id: orderId
        };

        const url = `${this.baseUrl}${API_ENDPOINTS.MAKE_PAYMENT}`;

        const apiCall = async () => {
            return await callApi<MakePaymentResponse>({
                url,
                method: 'POST',
                body: requestBody,
                headerToken: true
            });
        };

        return retryWithNetworkCheck(apiCall, 3, 2000);
    }

    async createReview(reviewData: CreateReviewRequest): Promise<ApiResponse<CreateReviewResponse>> {
        // Validate required fields
        if (!reviewData.orderId || reviewData.orderId.trim() === '') {
            return {
                success: false,
                error: 'Order ID is required',
                statusCode: 400,
                message: 'Please provide a valid order ID'
            };
        }

        if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
            return {
                success: false,
                error: 'Rating is required and must be between 1 and 5',
                statusCode: 400,
                message: 'Please provide a valid rating'
            };
        }

        if (!reviewData.comment || reviewData.comment.trim() === '') {
            return {
                success: false,
                error: 'Comment is required',
                statusCode: 400,
                message: 'Please provide a comment'
            };
        }

        const url = `${this.baseUrl}${API_ENDPOINTS.CREATE_REVIEW}`;

        const apiCall = async () => {
            return await callApi<CreateReviewResponse>({
                url,
                method: 'POST',
                body: reviewData,
                headerToken: true
            });
        };

        return retryWithNetworkCheck(apiCall, 3, 2000);
    }

    async changePaymentMethod(data: ChangePaymentMethodRequest): Promise<ApiResponse<ChangePaymentMethodResponse>> {
        if (!data.order_id || data.order_id.trim() === '') {
            return {
                success: false,
                error: 'Order ID is required',
                statusCode: 400,
                message: 'Please provide a valid order ID'
            };
        }

        const url = `${this.baseUrl}${API_ENDPOINTS.CHANGE_PAYMENT_METHOD}`;

        const apiCall = async () => {
            return await callApi<ChangePaymentMethodResponse>({
                url,
                method: 'POST',
                body: data,
                headerToken: true
            });
        };

        return retryWithNetworkCheck(apiCall, 3, 2000);
    }
}

export const orderService = new OrderService();

