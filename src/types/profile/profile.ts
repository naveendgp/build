export interface ProfileResponse {
  status: boolean;
  data: {
    user: User;
  };
  message: string;
}

export interface User {
  _id: string;
  phone: string;
  wallet: Wallet;
  loyalty_points: number;
  preferences: Preferences;
  status: string;
  fcm_token: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  app_version: AppVersion[];
  email: string;
  name: string;
  gender: string;
  support_phone_number: string;
  privacy_policy_url: string;
  terms_url?: string;
}

export interface Wallet {
  balance: number;
  currency: string;
}

export interface Preferences {
  notifications_enabled: boolean;
}

export interface Address {
  label: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
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
