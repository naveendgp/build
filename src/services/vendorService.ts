import { API_ENDPOINTS } from '../constants';
import { retryWithNetworkCheck } from '../utils/network';
import { callApi, ApiResponse } from './apiClient';
import { VendorDetailResponse, Vendor, VendorReviewsResponse } from '../types/vendor/vendorDetail';

class VendorService {
  private baseUrl = API_ENDPOINTS.BASE_URL;

  async getVendorDetails(vendorId: string): Promise<ApiResponse<VendorDetailResponse>> {
    if (!vendorId || vendorId.trim() === '') {
      return {
        success: false,
        error: 'Vendor ID is required',
        statusCode: 400,
        message: 'Please provide a valid vendor ID'
      };
    }

    const url = `${this.baseUrl}${API_ENDPOINTS.VENDOR_DETAILS}/${vendorId}`;

    const apiCall = async () => {
      return await callApi<VendorDetailResponse>({
        url,
        method: 'GET',
        headerToken: true
      });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  async getVendorReviews(vendorId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<VendorReviewsResponse>> {
    if (!vendorId || vendorId.trim() === '') {
      return {
        success: false,
        error: 'Vendor ID is required',
        statusCode: 400,
        message: 'Please provide a valid vendor ID'
      };
    }

    const url = `${this.baseUrl}${API_ENDPOINTS.VENDOR_REVIEWS}/${vendorId}/reviews?page=${page}&limit=${limit}`;

    const apiCall = async () => {
      return await callApi<VendorReviewsResponse>({
        url,
        method: 'GET',
        headerToken: true
      });
    };

    return retryWithNetworkCheck(apiCall, 3, 2000);
  }

  // Helper method to extract vendor data safely
  extractVendorData(response: ApiResponse<VendorDetailResponse>): Vendor | null {
    if (!response.success || !response.data?.data?.vendor) {
      return null;
    }
    return response.data.data.vendor;
  }

  // Helper method to validate vendor data
  validateVendorData(vendor: Vendor | null): boolean {
    if (!vendor) return false;

    // Check required fields
    const requiredFields = ['_id', 'shop_name', 'owner_name', 'phone', 'email'];
    return requiredFields.every(field => vendor[field as keyof Vendor]);
  }

  // Helper method to get vendor display data
  getVendorDisplayData(vendor: Vendor): any {

    const address = vendor.address;
    const fullAddress = address ? `${address.address_line1}, ${address.city}, ${address.state} ${address.pincode}` : 'Address not available';

    // Calculate max offer percentage from services
    const maxOfferPercent = vendor.services_offered?.reduce((max, service) => {
      return service.offer_percentage > max ? service.offer_percentage : max;
    }, 0) || 0;

    return {
      id: vendor._id,
      shopName: vendor.shop_name,
      ownerName: vendor.owner_name,
      phone: vendor.phone,
      email: vendor.email,
      address: fullAddress,
      rating: vendor.rating?.average || 0,
      totalReviews: vendor.rating?.total_reviews || 0,
      totalOrders: vendor.total_orders || 0,
      shopStatus: vendor.shop_status?.status || 'close',
      services: vendor.services_offered?.filter(service => service.is_active).map(service => ({
        service_id: service.service_id,
        service_name: service.service_name,
        image_url: service.image_url,
        pricing_type: service.pricing_type,
        is_active: service.is_active,
        maxOfferPercent: maxOfferPercent, // Add maxOfferPercent to each service for UI
      })) || [],
      walletBalance: vendor.wallet?.balance || 0,
      latitude: address?.latitude,
      longitude: address?.longitude,
    };
  }
}

export const vendorService = new VendorService();