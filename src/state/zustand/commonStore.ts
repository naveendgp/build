import { create } from 'zustand';
import { STRINGS } from '../../constants';
import { ProfileResponse, User } from '../../types/profile/profile';
import { ApiResponse } from '../../services/apiClient';

interface CommonState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
}

interface CommonActions {
  setProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getProfile: () => Promise<ApiResponse<ProfileResponse>>;
  logout: () => Promise<void>;
  clearProfile: () => void;
  refreshProfile: () => Promise<ApiResponse<ProfileResponse>>;
}

type CommonStore = CommonState & CommonActions;

export const useCommonStore = create<CommonStore>()((set, get) => ({
  // Initial state
  profile: null,
  isLoading: false,
  error: null,

  // Actions
  setProfile: (profile: User | null) => set({ profile }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setError: (error: string | null) => set({ error }),

  getProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      // Import commonService dynamically to avoid circular dependency
      const { commonService } = await import('../../services/commonService');
      const response = await commonService.getProfile();
      if (response.success && response.data) {
        // Extract user from ProfileResponse.data.user
        const profileResponse: ProfileResponse = response.data;
        if (profileResponse.status && profileResponse.data?.user) {
          set({ profile: profileResponse.data.user, isLoading: false });
        } else {
          set({ error: profileResponse.message || 'Failed to get profile', isLoading: false });
        }
        return response;
      } else {
        set({ error: response.error || 'Failed to get profile', isLoading: false });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get profile',
        isLoading: false
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get profile' };
    }
  },

  logout: async () => {
    try {
      // Import commonService dynamically to avoid circular dependency
      const { commonService } = await import('../../services/commonService');
      await commonService.logout();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    } finally {
      // AsyncStorage removed - storage clearing removed
      console.log('Logout completed');
      set({
        profile: null,
        error: null,
      });
    }
  },

  clearProfile: () => set({ profile: null }),

  // Refresh profile after address update
  refreshProfile: async () => {
    return get().getProfile();
  },
}));