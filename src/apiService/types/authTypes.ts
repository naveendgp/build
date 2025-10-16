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
