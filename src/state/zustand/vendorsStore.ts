import { create } from 'zustand';
import { VendorsResponse, Vendor } from '../../types/services/services';

interface VendorsState {
  vendors: VendorsResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface VendorsActions {
  setVendors: (vendors: VendorsResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getVendors: (requestBody: {
    sort: any[];
    isExpress: boolean | null;
    isOffer: boolean | null;
    serviceFilters: string[];
  }, page?: number, limit?: number, append?: boolean) => Promise<any>;
  clearError: () => void;
}

type VendorsStore = VendorsState & VendorsActions;

export const useVendorsStore = create<VendorsStore>()((set, get) => ({
  // Initial state
  vendors: null,
  isLoading: false,
  error: null,

  // Actions
  setVendors: (vendors: VendorsResponse | null) => set({ vendors }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  getVendors: async (requestBody, page = 1, limit = 10, append = false) => {
    set({ isLoading: true, error: null });
    try {
      // Import commonService dynamically to avoid circular dependency
      const { commonService } = await import('../../services/commonService');
      const response = await commonService.getVendors(requestBody, page, limit);
      if (response.success && response.data) {
        const currentState = get();
        if (append && currentState.vendors?.data?.vendors) {
          // Append new vendors to existing list for FlatList pagination
          set({
            vendors: {
              ...response.data,
              data: {
                ...response.data.data,
                vendors: [...currentState.vendors.data.vendors, ...response.data.data.vendors]
              }
            },
            isLoading: false
          });
        } else {
          // Replace vendors (new search/filter or first load)
          set({
            vendors: response.data,
            isLoading: false
          });
        }
        return response;
      } else {
        set({
          error: response.error || 'Failed to fetch vendors',
          isLoading: false
        });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch vendors',
        isLoading: false
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch vendors' };
    }
  },
}));