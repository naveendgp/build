import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isLoggedIn: boolean;
  token: string | null;

  // actions
  setLogin: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  token: null,

  // Called after successful login
  setLogin: async (token: string) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      set({ token, isLoggedIn: true });
    } catch (error) {
      console.error('Error saving auth data', error);
    }
  },

  // Called when user logs out
  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'isLoggedIn']);
      set({ token: null, isLoggedIn: false });
    } catch (error) {
      console.error('Error clearing auth data', error);
    }
  },

  // Restore persisted login on app start
  restoreSession: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const isLoggedIn = (await AsyncStorage.getItem('isLoggedIn')) === 'true';
      if (token && isLoggedIn) {
        set({ token, isLoggedIn });
      }
    } catch (error) {
      console.error('Error restoring session', error);
    }
  },
}));
