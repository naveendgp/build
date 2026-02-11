import { create } from 'zustand';
import { ServicesResponse } from '../../types/services/services';

interface ServicesState {
  services: ServicesResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface ServicesActions {
  setServices: (services: ServicesResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getServices: () => Promise<any>;
  clearError: () => void;
}

type ServicesStore = ServicesState & ServicesActions;

export const useServicesStore = create<ServicesStore>()((set, get) => ({
  // Initial state
  services: null,
  isLoading: false,
  error: null,

  // Actions
  setServices: (services: ServicesResponse | null) => set({ services }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  getServices: async () => {
    set({ isLoading: true, error: null });
    try {
      // Import commonService dynamically to avoid circular dependency
      const { commonService } = await import('../../services/commonService');
      const response = await commonService.getServices();
      if (response.success && response.data) {
        set({
          services: response.data,
          isLoading: false
        });
        return response;
      } else {
        set({
          error: response.error || 'Failed to fetch services',
          isLoading: false
        });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch services',
        isLoading: false
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch services' };
    }
  },
}));



