import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  fcmToken: string;
  isLoggedIn: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setFcmToken: (fcmToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      fcmToken: '',
      isLoggedIn: false,
      setToken: token => set({ token }),
      setFcmToken: fcmToken => set({ fcmToken }),
      logout: () => set({ token: null, isLoggedIn: false, fcmToken: '' }),
      setIsLoggedIn: isLoggedIn => set({ isLoggedIn }),
    }),
    {
      name: 'auth-storage', // 🗝 key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
