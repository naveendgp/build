import { LoginRequestModel, LoginResponseModel, VerifyOTPResponseModel } from '../types/auth/auth';
import { API_ENDPOINTS } from '../constants';
import { retryWithNetworkCheck } from '../utils/network';
import { callApi, ApiResponse } from './apiClient';

class AuthService {
  private baseUrl = API_ENDPOINTS.BASE_URL;

  async login(phoneNumber: string): Promise<ApiResponse<LoginResponseModel>> {
    const requestBody = new LoginRequestModel(phoneNumber).toJson();
    const url = `${this.baseUrl}${API_ENDPOINTS.LOGIN}`;

    const apiCall = async () => {
      return await callApi<LoginResponseModel>({ url, body: requestBody, headerToken:false });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async verifyOtp(
    phoneNumber: string,
    otp: number,
    token: string | null
  ): Promise<ApiResponse<VerifyOTPResponseModel>> {
    const VerifyOTPRequestModel = require('../types/auth/auth').VerifyOTPRequestModel;
    const requestBody = new VerifyOTPRequestModel(
      phoneNumber,
      token || '',
      otp.toString()
    ).toJson();

    const url = `${this.baseUrl}${API_ENDPOINTS.OTPVERIFY}`;

    const apiCall = async () => {
      return await callApi<VerifyOTPResponseModel>({ url, body: requestBody, method: 'POST', headerToken:false });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async sendOtp(phoneNumber: string): Promise<void> {
    console.log(`Simulated OTP sent to ${phoneNumber}`);
  }

  async resendOtp(phoneNumber: string): Promise<ApiResponse<any>> {
    const requestBody = {
      phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
    };
    const url = `${this.baseUrl}${API_ENDPOINTS.RESEND_OTP}`;

    const apiCall = async () => {
      return await callApi<any>({ url, body: requestBody, method: 'POST', headerToken: false });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

}

export const authService = new AuthService();