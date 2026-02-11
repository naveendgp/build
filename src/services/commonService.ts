import { API_ENDPOINTS } from '../constants';
import { retryWithNetworkCheck } from '../utils/network';
import { callApi, ApiResponse } from './apiClient';
import { FilterResponse, ServicesResponse, VendorsResponse } from '../types/services/services';
import { ProfileResponse } from '../types/profile/profile';

interface FilterListResponse {
  services: {
    DISTANCE_LOW_TO_HIGH: string;
    DISTANCE_HIGH_TO_LOW: string;
    DELIVERY_LOW_TO_HIGH: string;
    DELIVERY_HIGH_TO_LOW: string;
    RATING_LOW_TO_HIGH: string;
    RATING_HIGH_TO_LOW: string;
    OFFER_LOW_TO_HIGH: string;
    OFFER_HIGH_TO_LOW: string;
    COST_LOW_TO_HIGH: string;
    COST_HIGH_TO_LOW: string;
  };
  FilterOption: {
    IS_EXPRESS: string;
    IS_OFFER: string;
    IRON_AND_FOLD: string;
    DRY_CLEAN: string;
    WASH_AND_FOLD: string;
    IRON: string;
  };
}

class CommonService {
  private baseUrl = API_ENDPOINTS.BASE_URL;

  async getProfile(): Promise<ApiResponse<ProfileResponse>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.PROFILE}`;

    const apiCall = async () => {
      return await callApi<ProfileResponse>({ url, method: 'GET', headerToken: true });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async logout(): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.LOGOUT}`;

    const apiCall = async () => {
      return await callApi<any>({ url, method: 'POST', headerToken: true });
    };

    // Use retryWithNetworkCheck but don't throw - we want to logout even if API fails
    try {
      return await retryWithNetworkCheck(apiCall, 3, 2000);
    } catch (error) {
      // Return a response even if API fails - logout should proceed regardless
      console.error('Logout API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout API failed',
        data: null
      };
    }
  }

  async updateAvailability(status: number): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.UPDATE_AVAILABILITY}`;

    const apiCall = async () => {
      return await callApi<any>({ url, method: 'POST', body: { status } });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async getServices(): Promise<ApiResponse<ServicesResponse>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.LIST_SERVICES}`;

    const apiCall = async () => {
      return await callApi<ServicesResponse>({ url, method: 'GET', headerToken: true });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async getVendors(requestBody: {
    sort: any[];
    isExpress: boolean | null;
    isOffer: boolean | null;
    serviceFilters: string[];
    search: string;
  }, page: number = 1, limit: number = 10): Promise<ApiResponse<VendorsResponse>> {

    const url = `${this.baseUrl}${API_ENDPOINTS.LIST_VENDORS}?page=${page}&limit=${limit}`;

    const apiCall = async () => {
      return await callApi<VendorsResponse>({ url, method: 'POST', body: requestBody, headerToken: true });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async getFilterList(): Promise<ApiResponse<FilterResponse>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.FILTER_LIST}`;

    const apiCall = async () => {
      return await callApi<FilterResponse>({ url, method: 'GET', headerToken: true });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async updateProfile(requestBody: {
    name: string;
    email: string;
  }): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.UPDATE_PROFILE}`;

    const apiCall = async () => {
      return await callApi<any>({ url, method: 'POST', body: requestBody, headerToken: true });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }
}

export const commonService = new CommonService();