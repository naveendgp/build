export interface ProfileResponse {
  status: boolean;
  message: string;
  data: VendorProfile;
}

export interface VendorProfile {
  _id: string;
  phone: string;
  status: string;
  shop_status: ShopStatus;
  total_orders: number;
  services_offered: Service[];
  rating: Rating;
  wallet: Wallet;
  pickup_zones: any[];
  operating_hours?: OperatingHoursInput;
  createdAt: string;
  updatedAt: string;
  __v: number;
  fcm_token: string;
  aadhaar_number: string;
  address: Address;
  email: string;
  gst_number: string;
  owner_name: string;
  pan_number: string;
  shop_license_number: string;
  shop_name: string;
  app_version: AppVersion;
}

export interface ShopStatus {
  status: string;
  close_time: string | null;
  _id: string;
}

export interface Service {
  service_name: string;
  image_url: string;
  pricing_type: string;
  max_count_per_day: number;
  service_description: string;
  items: ServiceItem[];
  items_by_category: ItemsByCategory;
}

export interface ServiceItem {
  item_name: string;
  image_url: string;
  item_price: number;
  express_price: number;
  discount_percentage: number;
  item_description: string;
  category: string;
  is_active: boolean;
}

export interface ItemsByCategory {
  [key: string]: ServiceItem[];
}

export interface Rating {
  average: number;
  total_reviews: number;
  reviews: any[];
}

export interface Wallet {
  balance: number;
  currency: string;
}

export interface Address {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  landmark: string;
  _id: string;
}

export interface AppVersion {
  _id: string;
  app_type: string;
  version: string;
  is_forceupdate: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Input/Output Types for Services Update
export interface UpdateServiceItem {
  item_name: string;
  item_price: number;
  item_category: string;
  express_price: number;
  discount_percentage: number;
  is_active: boolean;
}

export interface UpdateServiceInput {
  service: {
    service_name: string;
    max_count_per_day: number;
    items: UpdateServiceItem[];
  };
}

export interface UpdateServicesResponse {
  status: boolean;
  message: string;
}

// Operating Hours Types
export interface DayHours {
  open: string;
  close: string;
}

export interface OperatingHoursInput {
  [key: string]: DayHours;
}

export interface UpdateOperatingHoursResponse {
  status: boolean;
  message: string;
}