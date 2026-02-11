import { API_ENDPOINTS } from '../constants';
import { retryWithNetworkCheck } from '../utils/network';
import { callApi, ApiResponse } from './apiClient';

export interface EditAddressRequest {
  addressId: string;
  label: string;
  address_line1: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

export interface EditAddressResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface DeleteAddressRequest {
  addressId: string;
}

export interface DeleteAddressResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface AddAddressRequest {
  label: string;
  address_line1: string;
  latitude: number;
  longitude: number;
}

export interface AddAddressResponse {
  status: boolean;
  message: string;
  data?: any;
}

class AddressService {
  private baseUrl = API_ENDPOINTS.BASE_URL;

  async editAddress(requestBody: EditAddressRequest): Promise<ApiResponse<EditAddressResponse>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.EDIT_ADDRESS}`;

    const apiCall = async () => {
      return await callApi<EditAddressResponse>({ url, method: 'POST', body: requestBody, headerToken: true });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async deleteAddress(requestBody: DeleteAddressRequest): Promise<ApiResponse<DeleteAddressResponse>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.REMOVE_ADDRESS}`;

    const apiCall = async () => {
      return await callApi<DeleteAddressResponse>({ url, method: 'DELETE', body: requestBody, headerToken: true });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async addAddress(requestBody: AddAddressRequest): Promise<ApiResponse<AddAddressResponse>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.ADD_ADDRESS}`;

    const apiCall = async () => {
      return await callApi<AddAddressResponse>({ url, method: 'POST', body: requestBody, headerToken: true });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }
}

export const addressService = new AddressService();

