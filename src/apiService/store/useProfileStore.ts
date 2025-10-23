import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VendorProfile } from '../types/profileTypes';
import { getProfile } from '../api/profileApi';

interface ProfileState {
  profile: VendorProfile | null;
  isLoading: boolean;
  error: string | null;
  setProfile: (profile: VendorProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProfile: () => void;
  refreshProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,
      setProfile: profile => set({ profile, error: null }),
      setLoading: isLoading => set({ isLoading }),
      setError: error => set({ error }),
      clearProfile: () => set({ profile: null, error: null }),
      refreshProfile: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await getProfile();
          set({ profile: response.data, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error?.response?.data?.message || 'Failed to refresh profile', 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
