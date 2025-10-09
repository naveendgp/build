// src/api/authApi.ts
import { ENDPOINTS } from './endpoints';
import { useApiStore } from './apiStore';

export const useAuthApi = () => {
  const { request, reset, data, loading, error, status } = useApiStore();

  const login = (phone: string) => {
    return request({
      url: ENDPOINTS.LOGIN,
      method: 'POST',
      data: { phone },
    });
  };

  const verifyOtp = (phone: string, otp: string) => {
    return request({
      url: ENDPOINTS.OTP_VERIFY,
      method: 'POST',
      data: { phone, otp },
    });
  };

  return { login, data, loading, error, reset, status };
};
