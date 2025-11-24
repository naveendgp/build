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
  bank_details?: BankDetails;
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
  documents: Documents;
  shop_image_url: string;
  profile_pic: string;
}
export interface Documents {
  aadhaar_card: string;
  pan_card: string;
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

  offer_percentage: number;
  offer_max_cap: number;
  express_time: number;
  standard_time: number;
  is_express_available: boolean;
  is_offer: boolean;
  is_active: boolean;
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
    service_id: string;
    service_name: string;
    max_count_per_day: number;
    is_express: boolean;
    is_offer: boolean;
    offer_max_cap: number;
    offer_percentage: number;
    express_time: number;
    standard_time: number;

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

// Bank Details Types
export interface BankDetails {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
  cancelled_cheque: string
}

// Bank Details API Types
export interface UpdateBankDetailsInput {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
}

export interface UpdateBankDetailsResponse {
  status: boolean;
  message: string;
}

// Toggle Service Active API Types
export interface ToggleService {
  service_id: string;
  is_active: boolean;
}

export interface ToggleServiceActiveInput {
  services: ToggleService[];
}

export interface ToggleServiceActiveResponse {
  status: boolean;
  message: string;
}

// List Services API Types
export interface ListServiceItem {
  _id: string;
  service_name: string;
  image_url: string;
  pricing_type: string;
  service_description: string;
  service_slug?: string;
  updatedAt: string;
}

export interface ListServicesResponse {
  status: boolean;
  message: string;
  data: ListServiceItem[];
}

// Services by State API Types
export interface ServiceByState {
  service_id: string;
  service_name: string;
  image_url: string;
  pricing_type: string;
  service_description: string;
  max_count_per_day: number;
  is_offer: boolean;
  offer_percentage: number;
  offer_max_cap: number;
  is_active: boolean;
  is_approved: boolean;
  is_express_available: boolean;
  express_delivery_time_minutes: number;
  normal_delivery_time_minutes: number;
  express_time: number;
  standard_time: number;
  active_items_count: number;
  total_items_count: number;
}

export interface ServicesByStateData {
  verified: ServiceByState[];
  unverified: ServiceByState[];
}

export interface ServicesByStateResponse {
  status: boolean;
  message: string;
  data: ServicesByStateData;
}