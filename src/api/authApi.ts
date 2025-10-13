import {
  LoginRequestModel,
  LoginResponseModel,
  OtpRequestModel,
  OtpVerificationResponseModel,
} from '../types/auth/auth';
import { API_ENDPOINTS } from '../constants';
import { retryWithNetworkCheck } from '../utils/network';
import { callApi } from '.';

class AuthService {
  private baseUrl = API_ENDPOINTS.BASE_URL;

  async login(phone: string): Promise<LoginResponseModel> {
    const requestBody = new LoginRequestModel(phone).toJson();
    const url = `${this.baseUrl}${API_ENDPOINTS.LOGIN}`;

    const apiCall = async () => {
      const responseData = await callApi<any>({ url, body: requestBody });
      console.log('Login API response:', responseData); // Log the full response
      // Return the response regardless of status, store previous response if needed
      return responseData;
    };

    return retryWithNetworkCheck(apiCall, 1, 2000);
  }

  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<OtpVerificationResponseModel> {
    const requestBody = new OtpRequestModel(phone, otp).toJson();
    const url = `${this.baseUrl}${API_ENDPOINTS.OTPVERIFY}`;

    const apiCall = async () => {
      const responseData = await callApi<any>({ url, body: requestBody });
      console.log('Login API response:', responseData); // Log the full response
      // Return the response regardless of status, store previous response if needed
      return responseData;
    };

    return retryWithNetworkCheck(apiCall, 1, 2000);
  }
}

export const authService = new AuthService();
