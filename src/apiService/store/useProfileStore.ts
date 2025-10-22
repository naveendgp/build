import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VendorProfile } from '../types/profileTypes';

interface ProfileState {
  profile: VendorProfile | null;
  isLoading: boolean;
  error: string | null;
  setProfile: (profile: VendorProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    set => ({
      profile: null,
      isLoading: false,
      error: null,
      setProfile: profile => set({ profile, error: null }),
      setLoading: isLoading => set({ isLoading }),
      setError: error => set({ error }),
      clearProfile: () => set({ profile: null, error: null }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
