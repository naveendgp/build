export interface VendorAddress {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  landmark?: string;
  _id: string;
}

export interface UserAddress {
  label?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
  _id: string;
}

export interface PaymentDetails {
  amount_to_vendor: number;
  amount_to_platform: number;
  delivery_fee: number;
  gst: number;
  isOfferApplied: boolean;
  offerDiscountAmount: number;
  totalPayableAmount: number;
}

export interface OrderItem {
  service_id: string;
  service_name: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price_per_item: number;
  total_price: number;
}

export interface StatusTimestamps {
  [status: string]: string;
}

export interface OrderUpdateLog {
  statusStr: string;
  status: number;
  timestamp: string
}

export interface VendorOrder {
  _id: string;
  order_number: number;
  status_type?: number;
  user_id: string;
  vendor_id: string;
  vendor_address: VendorAddress;
  user_address: UserAddress;
  status: string;
  status_timestamps: StatusTimestamps;
  is_express: boolean;
  payment_status: string;
  payment_details: PaymentDetails;
  total_amount: number;
  currency: string;
  order_notes?: string;
  rating_given: boolean;
  items: OrderItem[];
  user_otp: number;
  vendor_otp: string;
  created_at: string;
  expiry_at: string;
  updated_at: string;
  trip_type?: number;
  __v: number;
  updateLogs?: OrderUpdateLog[];
  rider?: OrderRider;
}

export interface OrderRider {
  name: string;
  phone: string;
}

export interface OrdersData {
  orders: VendorOrder[];
  total: number;
  page: string;
  limit: string;
  totalPages: number;
}

export interface OrdersResponse {
  status: boolean;
  message: string;
  data: OrdersData;
}

export enum OrderStatusCode {
  RECEIVED = 1,
  ACCEPTED = 2,
  READY_FOR_PICKUP = 3,
  COMPLETED = 4,
}

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
  [OrderStatus.DRIVER_ACCEPTED]: 'Driver has accepted your order',
  [OrderStatus.ARRIVED]: 'Driver has arrived at your location',
  [OrderStatus.VERIFIED]: 'Items have been verified',
  [OrderStatus.PICKED_UP]: 'Order has been picked up',
  [OrderStatus.PAID]: 'Payment has been confirmed',
  [OrderStatus.REACHED]: 'Driver has reached the vendor',
  [OrderStatus.DELIVERED]: 'Order has been delivered',
  [OrderStatus.PROCESSING]: 'Order is being processed',
  [OrderStatus.PROCESSED]: 'Order has been processed',
  [OrderStatus.CANCELLED]: 'Order has been cancelled',
  [OrderStatus.REJECTED]: 'Order has been rejected',
  [OrderStatus.UNACCEPTED]: 'Order was not accepted',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Order is out for delivery',
  [OrderStatus.VENDOR_PENDING]: 'Order will be accepted shortly',
  [OrderStatus.RIDER_PENDING]: 'Rider is being assigned',
  [OrderStatus.CALL_BUTTON_VISIBLE]: ' is your rider',
  [OrderStatus.OTP_VISIBLE]: 'OTP for the rider',
};

// Helper function to get status message
export const getOrderStatusMessage = (status: number): string => {
  return OrderStatusMessages[status as OrderStatus] || 'Unknown status';
};


export interface AcceptOrderResponse {
  status: boolean;
  message: string;
  data: Record<string, never>;
}

export interface CompleteOrderResponse {
  status: boolean;
  message: string;
  data: Record<string, never>;
}

