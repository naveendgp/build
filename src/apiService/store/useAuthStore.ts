import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVendorVerificationStore } from './useVendorVerificationStore';

interface AuthState {
  token: string | null;
  fcmToken: string;
  isLoggedIn: boolean;
  documentState:string;
  mobileNumber: string;
  navigationRef: any;
  setToken: (token: string) => void;
  logout: () => void;
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
      documentState:'',
      mobileNumber: '',
      navigationRef: null,
      setDocumentState: documentState => set({ documentState }),
      setToken: token => set({ token }),
      setFcmToken: fcmToken => set({ fcmToken }),
      setNavigationRef: ref => set({ navigationRef: ref }),
      setMobileNumber: mobile => set({ mobileNumber: mobile }),
      logout: () => {
        set({ token: null, isLoggedIn: false, fcmToken: '', documentState: '', mobileNumber: '' });
        // Clear vendor verification data on logout
        const { clearAll } = useVendorVerificationStore.getState();
        clearAll();
        // Reset navigation to Login screen
        const { navigationRef } = useAuthStore.getState();
        if (navigationRef?.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      },
      setIsLoggedIn: isLoggedIn => set({ isLoggedIn }),
    }),
    {
      name: 'auth-storage', // 🗝 key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
