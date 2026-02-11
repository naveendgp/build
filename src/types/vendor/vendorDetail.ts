// Vendor Detail API Response Types

export interface VendorAddress {
  _id: string;
  address_line1: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  landmark: string;
}

export interface VendorShopStatus {
  status: 'open' | 'close';
  close_time: string | null;
  _id: string;
}

export interface VendorRating {
  average?: number;
  total_reviews?: number;
  reviews?: any[]; // Can be expanded if review structure is defined
}

export interface VendorWallet {
  balance: number;
  currency: string;
}

export interface ServiceItem {
  item_id: string;
  item_name: string;
  image_url: string;
  item_price: number;
  express_price: number;
  min_weight?: number;
  max_weight?: number;
  item_description: string;
  category: string;
  is_active: boolean;
}

export interface VendorService {
  express_price_per_kg?: number;
  standard_price_per_kg?: number;
  price_per_kg?: number;
  service_id: string;
  service_name: string;
  image_url: string;
  pricing_type: 'per_pc' | 'per_kg';
  max_count_per_day: number;
  service_description: string;
  items: ServiceItem[];
  is_offer: boolean;
  offer_percentage: number;
  offer_max_cap?: number;
  is_active: boolean;
  is_approved?: boolean;
  is_express_available?: boolean;
  express_delivery_time_minutes?: number;
  normal_delivery_time_minutes?: number;
  express_time?: number;
  standard_time?: number;
  maxOfferPercent?: number; // Added for UI purposes
}

export interface Vendor {
  _id: string;
  phone: string;
  status: 'active' | 'inactive';
  shop_status: VendorShopStatus;
  total_orders: number;
  services_offered: VendorService[];
  last_service_updated_at: string | null;
  rating: VendorRating;
  wallet: VendorWallet;
  pickup_zones: any[]; // Can be expanded if needed
  session_token: string;
  createdAt: string;
  updatedAt: string;
  express_status: boolean;
  __v: number;
  fcm_token: string;
  aadhaar_number?: string;
  address: VendorAddress;
  bank_details?: {
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    cancelled_cheque: string;
    ifsc_code: string;
    upi_id: string;
  };
  contactNum: string;
  documents?: {
    aadhaar_card: string;
    pan_card: string;
  };
  email: string;
  gst_number: string;
  owner_name: string;
  pan_number?: string;
  profile_pic?: string;
  shop_image_url: string;
  shop_license_number?: string;
  shop_name: string;
  is_express?: boolean;
  min_express_time?: string;
  min_standard_time?: string;
  startsAt?: number;
}

export interface VendorDetailResponse {
  status: boolean;
  data: {
    vendor: Vendor;
    category: Record<string, string[]>;
    distance: {
      distance_text: string;
      distance_value: number;
      duration_text: string;
      duration_value: number;
      destination_address: string;
      target_address: string;
      distance_val: string;
    };
    offerDetails: {
      max_offer_percentage: {
        total_percentage: number;
        max_cap: number;
      };
      is_offer: boolean;
    };
    expressDetails: {
      fastest_express_time_hours: number;
      is_express_available: boolean;
    };
  };
  message: string;
}

// Helper types for UI
export interface VendorServiceSummary {
  service_id: string;
  service_name: string;
  image_url: string;
  pricing_type: 'per_pc' | 'per_kg';
  is_active: boolean;
  maxOfferPercent?: number;
}

export interface VendorDisplayData {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  totalReviews: number;
  totalOrders: number;
  shopStatus: 'open' | 'close';
  services: VendorServiceSummary[];
  walletBalance: number;
  latitude?: number;
  longitude?: number;
}

// Review API Response Types
export interface ReviewUser {
  _id: string;
  name: string;
}

export interface Review {
  _id: string;
  user_id: ReviewUser;
  vendor_id: string;
  order_id: string;
  rating: number;
  comment: string;
  is_verified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  serviceName: string;
}

export interface VendorReviewsResponse {
  status: boolean;
  data: {
    reviews: Review[];
    average: number;
    totalReviews: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}