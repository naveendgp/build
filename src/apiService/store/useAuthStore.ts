import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVendorVerificationStore } from './useVendorVerificationStore';
import { useProfileStore } from './useProfileStore';
import { logout as logoutApi } from '../api/authApi';

interface AuthState {
  token: string | null;
  fcmToken: string;
  isLoggedIn: boolean;
  documentState: string;
  mobileNumber: string;
  navigationRef: any;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
  localLogout: () => void;
  setNavigationRef: (ref: any) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setFcmToken: (fcmToken: string) => void;
  setDocumentState: (documentState: string) => void;
  setMobileNumber: (mobile: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      fcmToken: '',
      isLoggedIn: false,
      documentState: '',
      mobileNumber: '',
      navigationRef: null,
      setDocumentState: documentState => set({ documentState }),
      setToken: token => set({ token }),
      setFcmToken: fcmToken => set({ fcmToken }),
      setNavigationRef: ref => set({ navigationRef: ref }),
      setMobileNumber: mobile => set({ mobileNumber: mobile }),
      logout: async () => {
        // Call logout API, but always perform logout locally regardless of success/failure
        try {
          await logoutApi();
        } catch (error) {
          // Ignore API errors - logout locally anyway
          console.log('Logout API call failed, but proceeding with local logout:', error);
        } finally {
          // Always clear local state regardless of API result
          set({ token: null, isLoggedIn: false, fcmToken: '', documentState: '', mobileNumber: '' });
          // Clear vendor verification data on logout
          const { clearAll } = useVendorVerificationStore.getState();
          clearAll();
          // Clear profile data on logout
          const { clearProfile } = useProfileStore.getState();
          clearProfile();
        }
      },
      localLogout: () => {
        // Local logout without API call - used for session expired flow
        set({ token: null, isLoggedIn: false, fcmToken: '', documentState: '', mobileNumber: '' });
        // Clear vendor verification data on logout
        const { clearAll } = useVendorVerificationStore.getState();
        clearAll();
        // Clear profile data on logout
        const { clearProfile } = useProfileStore.getState();
        clearProfile();
      },
      setIsLoggedIn: isLoggedIn => set({ isLoggedIn }),
    }),
    {
      name: 'auth-storage', // 🗝 key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
