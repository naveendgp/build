/**
 * Offer types and interfaces for the user app
 */

export interface Offer {
    _id: string;
    code: string;
    title: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_discount_cap: number;
    min_order_value: number;
    valid_until: string;
}

export interface CouponValidationRequest {
    code: string;
    order_total: number;
    service_ids?: string[];
}

export interface CouponValidationResponse {
    valid: boolean;
    discount_amount: number;
    message: string;
    offer?: {
        code: string;
        title: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        max_discount_cap: number;
    };
}

export interface UserOffersResponse {
    success: boolean;
    data: Offer[];
}

export interface ValidateCouponApiResponse {
    success: boolean;
    data: CouponValidationResponse;
}
