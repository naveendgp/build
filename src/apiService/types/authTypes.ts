// src/types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginPayload {
  phone: string;
}

export interface LoginResponse {
  status: boolean;
  message: string;
}

export interface OtpPayload {
  phone: string;
  otp: string;
  fcm_token: string;
}

export interface OtpResponse {
  status: boolean;
  message: string;
  data: {
    token: string;
    status: string;
  };
}

export interface RegisterPayload {
  phone: string;
}

export interface RegisterResponse {
  status: boolean;
  message: string;
}

export interface ErrorResponse {
  message: string;
  error: string;
}

export interface DayHours {
  open: string;
  close: string;
}

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface RegisterCompletePayload {
  shop_name: string;
  owner_name: string;
  email: string;
  gst_number: string;
  pan_number: string;
  shop_license_number: string;
  aadhaar_number: string;
  address_line1: string;
  pincode: string;
  landmark: string;
  latitude: number;
  longitude: number;
  contactNum: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch?: string;
  upi_id: string;
  operating_hours: OperatingHours;
}

export interface RegisterCompleteResponse {
  status: boolean;
  message: string;
  data: RegisterCompleteResponseData;
}

export interface RegisterCompleteResponseData {
  status: string;
}

export interface ShopDocumentUploadPayload {
  shop_name: string;
  owner_name: string;
  email: string;
  gst_number: string;
  pan_number: string;
  shop_license_number: string;
  address_line1: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode: string;
  landmark: string;
  latitude: number;
  longitude: number;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  aadhaar_number: string;
}