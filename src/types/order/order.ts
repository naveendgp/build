export interface ServiceItem {
    service_id: string;
    service_name: string;
    item_id: string;
    item_name: string;
    quantity: number;
}

export interface PlaceOrderRequest {
    pickup_address_id: string;
    vendor_id: string;
    service_items: ServiceItem[];
    is_express: boolean;
    order_notes?: string;
    offer_code?: string;
}

export interface PlaceOrderResponse {
    success?: boolean;
    message?: string;
    data?: {
        order_id?: string;
        order_number?: string;
        status?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

// Order Preview Types
export interface PreviewAddress {
    address_line1: string;
    address_line2?: string;
    city?: string;
    state?: string;
    pincode: string;
    latitude: number;
    longitude: number;
    landmark?: string;
    _id: string;
}

export interface PreviewPickupAddress extends PreviewAddress {
    label: string;
    is_default: boolean;
}

export interface PreviewVendor {
    vendor_id: string;
    shop_name: string;
    address: PreviewAddress;
    is_express_available: boolean;
    express_delivery_time: string;
    standard_delivery_time: string;
    pickup_address: PreviewPickupAddress;
    items: PreviewItem[];
    is_express: boolean;
    order_notes: string;
    pricing: PreviewPricing;
    payment_breakdown: PreviewPaymentBreakdown;
    currency: string;
    distance_map: DistanceMap[];


}

export interface PreviewItem {
    service_id: string;
    service_name: string;
    item_id: string;
    item_name: string;
    quantity: number;
    price_per_item: number;
    total_price: number;

    express_price_per_item: number;
    normal_price_per_item: number;
    type: string;
}

export interface DistanceMap {
    address_id: string;
    distance: number;
    duration?: number;
    is_deliverable: boolean;
}

export interface PreviewPricing {
    subtotal: number;
    offer_discount: number;
    is_offer_applied: boolean;
    offer_percentage: number;
    offer_max_cap: number;
    after_offer_amount: number;
    delivery_fee: number;
    platform_fee: number;
    gst: number;
    total_payable_amount: number;
}

export interface PreviewPaymentBreakdown {
    amount_to_platform: number;
    amount_to_vendor: number;
    amount_to_vendor_after_commission: number;
    delivery_fee: number;
    grand_total: number;
    gst: number;
    isOfferApplied: boolean;
    is_payment_eligible: boolean;
    item_total: number;
    offerDiscountAmount: number;
    totalPayableAmount: number;
}


export interface OrderPreview {
    vendor: PreviewVendor;
}

export interface OrderPreviewResponse {
    status: boolean;
    data: {
        order_preview: OrderPreview;
    };
    message: string;
}

export interface OrderPreviewRequest {
    pickup_address_id: string;
    vendor_id: string;
    service_items: ServiceItem[];
    is_express: boolean;
    order_notes?: string;
    offer_code?: string;
}

// Orders History Types
export interface OrderVendorAddress {
    address_line1: string;
    address_line2?: string;
    city?: string;
    state?: string;
    pincode: string;
    latitude: number;
    longitude: number;
    landmark?: string;
    _id: string;
}

export interface OrderUserAddress {
    label: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    is_default: boolean;
    _id: string;
}

export interface OrderStatusTimestamps {
    accepted_at?: string;
    picked_up_at?: string;
    in_progress_at?: string;
    ready_at?: string;
    out_for_delivery_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
    unaccepted_at?: string;
}

export interface OrderPaymentDetails {
    amount_to_vendor: number;
    amount_to_platform: number;
    delivery_fee: number;
    gst: number;
    isOfferApplied: boolean;
    offerDiscountAmount: number;
    totalPayableAmount: number;
    is_payment_eligible: boolean;
    item_total: number;
    grand_total: number;
}

export interface OrderHistoryItem {
    service_id: string;
    service_name: string;
    item_id: string;
    item_name: string;
    quantity: number;
    price_per_item: number;
    total_price: number;
    item_category: string;
    weight: number;
}

export interface OrderVendorShopStatus {
    status: string;
    close_time: string | null;
    _id: string;
}

export interface OrderVendorWallet {
    balance: number;
    currency: string;
}

export interface OrderVendor {
    _id: string;
    phone: string;
    status: string;
    shop_status: OrderVendorShopStatus;
    total_orders: number;
    last_service_updated_at: string | null;
    wallet: OrderVendorWallet;
    pickup_zones: any[];
    updatedAt: string;
    __v: number;
    aadhaar_number: string;
    email: string;
    gst_number: string;
    owner_name: string;
    pan_number: string;
    shop_license_number: string;
    shop_name: string;
    fcm_token?: string;
}

export interface OrderUpdateLog {
    statusStr: string;
    status: number;
    timestamp: string;
}

// Order Status Enum - Based on actual status codes from the system
export enum OrderStatus {
    CREATED = 1,
    ACCEPTED = 2,
    DRIVER_ACCEPTED = 3,
    ARRIVED = 4,
    VERIFIED = 5, // ITEM_CONFIRMATION / verified_at
    PICKED_UP = 6, // OTP_CONFIRMATION / picked_up_at
    PAID = 7, // PAYMENT_CONFIRMATION / paid_at
    REACHED = 8,
    DELIVERED = 9, // OTP_DELIVERED / delivered_at
    PROCESSING = 10, // processing_at
    PROCESSED = 11, // processed_at
    CANCELLED = 12, // cancelled_at
    REJECTED = 13, // rejected_at
    UNACCEPTED = 14, // unaccepted_at
    OUT_FOR_DELIVERY = 15, // out_for_delivery_at
    VENDOR_PENDING = 16, // vendor_YET TO ACCEPT
    RIDER_PENDING = 17, // rider_YET TO ACCEPT
    CALL_BUTTON_VISIBLE = 18, // completed_at
    OTP_VISIBLE = 19, // otp_visible_at

}

// Order Status Messages Mapping
export const OrderStatusMessages: Record<OrderStatus, string> = {
    [OrderStatus.CREATED]: 'Order has been created',
    [OrderStatus.ACCEPTED]: 'Shop has accepted your order request',
    [OrderStatus.DRIVER_ACCEPTED]: 'Agent has accepted your order',
    [OrderStatus.ARRIVED]: 'Agent has arrived at your location',
    [OrderStatus.VERIFIED]: 'Items have been verified',
    [OrderStatus.PICKED_UP]: 'Order List has been confirmed by the agent',
    [OrderStatus.PAID]: 'Payment has been confirmed',
    [OrderStatus.REACHED]: 'Agent has reached the vendor',
    [OrderStatus.DELIVERED]: 'Order has been delivered',
    [OrderStatus.PROCESSING]: 'Order received at the shop and is being processed ',
    [OrderStatus.PROCESSED]: 'Order is ready for delivery',
    [OrderStatus.CANCELLED]: 'Order has been cancelled',
    [OrderStatus.REJECTED]: 'Order has been rejected',
    [OrderStatus.UNACCEPTED]: 'Order was not accepted',
    [OrderStatus.OUT_FOR_DELIVERY]: 'Order is out for delivery',
    [OrderStatus.VENDOR_PENDING]: 'Order will be accepted shortly',
    [OrderStatus.RIDER_PENDING]: 'Agent is being assigned',
    [OrderStatus.CALL_BUTTON_VISIBLE]: ' is your agent',
    [OrderStatus.OTP_VISIBLE]: 'OTP for the agent',
};

// Helper function to get status message
export const getOrderStatusMessage = (status: number): string => {
    return OrderStatusMessages[status as OrderStatus] || 'Unknown status';
};

export interface Order {
    _id: string;
    order_number: number;
    user_id?: string;
    vendor_id: string;
    trip_type: number;
    status_type: number;
    vendor_address: OrderVendorAddress;
    user_address: OrderUserAddress;
    status: string;
    invoice_url?: string;
    status_timestamps: OrderStatusTimestamps;
    is_express: boolean;
    payment_status: string;
    payment_details: OrderPaymentDetails;
    total_amount: number;
    currency: string;
    order_notes?: string;
    rating_given: boolean;
    items: OrderHistoryItem[];
    is_settled_to_vendor: boolean;
    settled_amount?: number;
    user_otp: number;
    vendor_otp: string;
    created_at: string;
    updated_at: string;
    __v: number;
    shop_name: string;
    vendor?: OrderVendor;
    updateLogs?: OrderUpdateLog[];
    rider?: OrderRider;
    is_verified: boolean;
    user_rating: number;
}

export interface OrderRider {
    name: string;
    phone: string;
}

export interface OrdersHistoryData {
    orders: Order[];
    total: number;
    page: string | number;
    limit: string | number;
    totalPages: number;
}

export interface OrdersHistoryResponse {
    status: boolean;
    data: OrdersHistoryData;
    message: string;
}

// Order Detail Response
export interface OrderDetailData {
    order: Order;
}

export interface OrderDetailResponse {
    status: boolean;
    data: OrderDetailData;
    message: string;
}

// Payment Types
export interface MakePaymentRequest {
    order_id: string;
}

export interface MakePaymentResponse {
    status: boolean;
    data: {
        paymentLink: string;
    };
    message: string;
}

// Review Types
export interface CreateReviewRequest {
    orderId: string;
    rating: number;
    comment: string;
}

export interface CreateReviewResponse {
    status: boolean;
    data?: {
        review_id?: string;
        [key: string]: any;
    };
    message: string;
}

export interface ChangePaymentMethodRequest {
    order_id: string;
    payment_method: number;
}

export interface ChangePaymentMethodResponse {
    status: boolean;
    message: string;
    data?: any;
}

