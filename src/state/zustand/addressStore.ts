import { create } from 'zustand';
import { Address } from '../../types/profile/profile';
import { addressService, AddAddressRequest, EditAddressRequest, DeleteAddressRequest } from '../../services/addressService';
import { ApiResponse } from '../../services/apiClient';
import { useCommonStore } from './commonStore';
import { useServicesStore } from './servicesStore';
import { useVendorsStore } from './vendorsStore';

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  isDeleting: string | null; // Address ID being deleted
  isAdding: boolean;
  isEditing: boolean;
  error: string | null;
}

interface AddressActions {
  setAddresses: (addresses: Address[]) => void;
  setLoading: (loading: boolean) => void;
  setDeleting: (addressId: string | null) => void;
  setAdding: (adding: boolean) => void;
  setEditing: (editing: boolean) => void;
  setError: (error: string | null) => void;

  // Address operations
  addAddress: (requestBody: AddAddressRequest) => Promise<ApiResponse<any>>;
  editAddress: (requestBody: EditAddressRequest) => Promise<ApiResponse<any>>;
  deleteAddress: (addressId: string) => Promise<ApiResponse<any>>;

  // Refresh addresses from profile
  refreshAddresses: () => Promise<void>;

  // Clear state
  clearError: () => void;
  reset: () => void;
}

type AddressStore = AddressState & AddressActions;

export const useAddressStore = create<AddressStore>()((set, get) => ({
  // Initial state
  addresses: [],
  isLoading: false,
  isDeleting: null,
  isAdding: false,
  isEditing: false,
  error: null,

  // Setters
  setAddresses: (addresses: Address[]) => set({ addresses }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setDeleting: (isDeleting: string | null) => set({ isDeleting }),

  setAdding: (isAdding: boolean) => set({ isAdding }),

  setEditing: (isEditing: boolean) => set({ isEditing }),

  setError: (error: string | null) => set({ error }),

  // Add address
  addAddress: async (requestBody: AddAddressRequest) => {
    set({ isAdding: true, error: null });
    try {
      const response = await addressService.addAddress(requestBody);

      if (response.success && response.data?.status) {
        // Refresh addresses after successful add
        await get().refreshAddresses();
        set({ isAdding: false });
        return response;
      } else {
        set({
          error: response.error || response.data?.message || 'Failed to add address',
          isAdding: false
        });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add address',
        isAdding: false
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add address'
      };
    }
  },

  // Edit address
  editAddress: async (requestBody: EditAddressRequest) => {
    set({ isEditing: true, error: null });
    try {
      const response = await addressService.editAddress(requestBody);

      if (response.success && response.data?.status) {
        // Refresh addresses after successful edit
        await get().refreshAddresses();

        // Refresh location-based APIs in HomeScreen
        // Refresh services
        useServicesStore.getState().getServices().catch(error => {
          console.error('Failed to refresh services after address edit:', error);
        });

        // Refresh vendors with default filters (same as HomeScreen)
        useVendorsStore.getState().getVendors({
          sort: [],
          isExpress: null,
          isOffer: null,
          ironandfold: false,
          dryclean: false,
          washandfold: false,
          iron: false,
        }).catch(error => {
          console.error('Failed to refresh vendors after address edit:', error);
        });

        set({ isEditing: false });
        return response;
      } else {
        set({
          error: response.error || response.data?.message || 'Failed to edit address',
          isEditing: false
        });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to edit address',
        isEditing: false
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit address'
      };
    }
  },

  // Delete address
  deleteAddress: async (addressId: string) => {
    set({ isDeleting: addressId, error: null });
    try {
      const response = await addressService.deleteAddress({ addressId });

      if (response.success && response.data?.status) {
        // Optimistically remove address from local state
        set(state => ({
          addresses: state.addresses.filter(addr => addr._id !== addressId),
          isDeleting: null
        }));

        // Refresh addresses from profile to ensure sync
        await get().refreshAddresses();

        return response;
      } else {
        set({
          error: response.error || response.data?.message || 'Failed to delete address',
          isDeleting: null
        });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete address',
        isDeleting: null
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete address'
      };
    }
  },

  // Refresh addresses from profile
  refreshAddresses: async () => {
    try {
      // Refresh profile which contains addresses
      const profileResponse = await useCommonStore.getState().refreshProfile();

      if (profileResponse.success && profileResponse.data?.status) {
        const profile = useCommonStore.getState().profile;
        if (profile?.addresses) {
          set({ addresses: profile.addresses });
        }
      }
    } catch (error) {
      console.error('Failed to refresh addresses:', error);
      // Don't set error here as it's a background refresh
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    addresses: [],
    isLoading: false,
    isDeleting: null,
    isAdding: false,
    isEditing: false,
    error: null,
  }),
}));

