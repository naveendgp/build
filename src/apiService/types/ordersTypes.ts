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
  updated_at: string;
  __v: number;
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

