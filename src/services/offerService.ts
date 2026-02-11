import { callApi, ApiResponse } from './apiClient';
import { API_ENDPOINTS, HTTP_METHODS } from '../constants';
import {
    Offer,
    CouponValidationRequest,
    CouponValidationResponse,
    UserOffersResponse,
    ValidateCouponApiResponse,
} from '../types/offer';

/**
 * Offer Service
 * Handles all offer/coupon-related API calls
 */
class OfferServiceClass {
    private baseUrl = API_ENDPOINTS.API_ROOT_URL;

    /**
     * Get available offers for the logged-in user
     */
    async getUserOffers(): Promise<ApiResponse<Offer[]>> {
        const response = await callApi<UserOffersResponse>({
            url: `${this.baseUrl}${API_ENDPOINTS.USER_OFFERS}`,
            method: HTTP_METHODS.GET,
        });

        if (response.success && response.data?.data) {
            return {
                success: true,
                data: response.data.data,
                message: response.message,
            };
        }

        return {
            success: false,
            error: response.error || 'Failed to fetch offers',
            data: [],
        };
    }

    /**
     * Validate a coupon code against an order
     */
    async validateCoupon(
        code: string,
        orderTotal: number,
        serviceIds?: string[]
    ): Promise<ApiResponse<CouponValidationResponse>> {
        const requestBody: CouponValidationRequest = {
            code: code.toUpperCase(),
            order_total: orderTotal,
            service_ids: serviceIds,
        };

        const response = await callApi<ValidateCouponApiResponse>({
            url: `${this.baseUrl}${API_ENDPOINTS.VALIDATE_COUPON}`,
            method: HTTP_METHODS.POST,
            body: requestBody,
        });

        if (response.success && response.data?.data) {
            return {
                success: true,
                data: response.data.data,
                message: response.message,
            };
        }

        return {
            success: false,
            error: response.error || 'Failed to validate coupon',
            data: {
                valid: false,
                discount_amount: 0,
                message: response.error || 'Validation failed',
            },
        };
    }

    /**
     * Apply a coupon to an existing order
     */
    async applyCoupon(
        code: string,
        orderId: string
    ): Promise<ApiResponse<any>> {
        const requestBody = {
            code: code.toUpperCase(),
            order_id: orderId,
        };

        const response = await callApi<any>({
            url: `${this.baseUrl}${API_ENDPOINTS.APPLY_COUPON}`,
            method: HTTP_METHODS.POST,
            body: requestBody,
        });

        return response;
    }

    /**
     * Calculate discount amount based on offer details
     */
    calculateDiscount(
        offer: Offer,
        orderTotal: number
    ): { discountAmount: number; isValid: boolean; message: string } {
        // Check minimum order value
        if (offer.min_order_value > 0 && orderTotal < offer.min_order_value) {
            return {
                discountAmount: 0,
                isValid: false,
                message: `Minimum order value of ₹${offer.min_order_value} required`,
            };
        }

        let discountAmount = 0;

        if (offer.discount_type === 'percentage') {
            discountAmount = (orderTotal * offer.discount_value) / 100;
            if (offer.max_discount_cap > 0 && discountAmount > offer.max_discount_cap) {
                discountAmount = offer.max_discount_cap;
            }
        } else {
            discountAmount = Math.min(offer.discount_value, orderTotal);
        }

        return {
            discountAmount: Math.round(discountAmount * 100) / 100,
            isValid: true,
            message: 'Discount applied',
        };
    }

    /**
     * Format offer discount text for display
     */
    formatDiscountText(offer: Offer): string {
        if (offer.discount_type === 'percentage') {
            let text = `${offer.discount_value}% OFF`;
            if (offer.max_discount_cap > 0) {
                text += ` (up to ₹${offer.max_discount_cap})`;
            }
            return text;
        }
        return `₹${offer.discount_value} OFF`;
    }
}

// Export singleton instance
export const OfferService = new OfferServiceClass();
