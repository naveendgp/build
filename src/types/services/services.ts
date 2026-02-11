// Service Types for API responses

export interface Banner {
  _id: string;
  asseturl: string;
  isactive: boolean;
  enableStatus: boolean;
  position: number;
  type: string;
  cta: string;
}

export interface Service {
  _id: string;
  service_name: string;
  service_slug?: string;
  image_url: string;
  pricing_type: "per_pc" | "per_kg";
  service_description: string;
  updatedAt: string;
}

export interface ServicesResponseData {
  banners: Banner[];
  services: Service[];
}

export interface ServicesResponse {
  status: boolean;
  data: ServicesResponseData;
  message: string;
}

// Vendor Types
export interface Item {
  item_id: string;
  item_name: string;
  image_url: string;
  item_price: number;
  express_price: number;
  item_description: string;
  category: string;
  is_active: boolean;
}

export interface ServiceOffered {
  service_id: string;
  service_name: string;
  image_url: string;
  pricing_type: "per_pc" | "per_kg";
  max_count_per_day: number;
  standard_price_per_kg?: number;
  express_price_per_kg?: number;
  service_description: string;
  items: Item[];
  is_offer: boolean;
  offer_percentage: number;
  offer_max_cap?: number;
  is_active: boolean;
  is_approved?: boolean;
  is_express_available?: boolean;
  express_delivery_time_minutes?: string;
  normal_delivery_time_minutes?: string;
  express_time?: number;
  standard_time?: number;
}

export interface ShopStatus {
  status: "open" | "close";
  close_time: string | null;
  _id: string;
}

export interface Rating {
  average: number;
  total_reviews: number;
  reviews: any[]; // Can be more specific if needed
}

export interface Wallet {
  balance: number;
  currency: string;
}

export interface Address {
  address_line1: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  landmark: string;
  _id: string;
}

export interface Vendor {
  _id: string;
  phone: string;
  status: string;
  shop_status: ShopStatus;
  total_orders: number;
  services_offered: ServiceOffered[];
  last_service_updated_at: string | null;
  rating: Rating;
  wallet: Wallet;
  pickup_zones: any[]; // Can be more specific
  session_token: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  fcm_token: string;
  aadhaar_number: string;
  address: Address;
  contactNum: string;
  email: string;
  gst_number: string;
  owner_name: string;
  pan_number: string;
  profile_pic: string;
  shop_image_url: string;
  shop_license_number: string;
  shop_name: string;
  distance: string;
  express_status: boolean;
  min_express_time: string;
  min_standard_time: string;
  startsAt: number;
  max_offer_percentage?: {
    total_percentage: number;
    max_cap: number;
  };
  is_offer: boolean;
}

export interface VendorsResponseData {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VendorsResponse {
  status: boolean;
  data: VendorsResponseData;
  message: string;
}

//Filter List Response
export interface FilterResponse {
  status: boolean;
  data: FilterResponseData;
  message: string;
}

export interface FilterResponseData {
  services: string[];
  filter_options: Array<Record<string, string>>;
}
