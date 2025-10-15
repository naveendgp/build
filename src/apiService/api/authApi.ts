// src/api/authApi.ts
import api from './axios';
import {
  LoginPayload,
  LoginResponse,
  OtpPayload,
  OtpResponse,
  RegisterPayload,
  RegisterResponse,
} from '../types/types';

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await api.post('/vendor/login', payload);
  return response.data;
};

export const verifyOtp = async (payload: OtpPayload): Promise<OtpResponse> => {
  const response = await api.post('/vendor/verify-otp', payload);
  return response.data;
};

export const register = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  const response = await api.post('/vendor/register', payload);
  return response.data;
};
