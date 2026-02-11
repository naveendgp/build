import { create } from 'zustand';
import { STRINGS } from '../../constants/strings';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  userType?: string;
  isNewUser?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // signupData: SignupData | null; // Store signup response for OTP verification
  token: string | null; // Store authentication token
  isHandling401: boolean; // Flag to prevent multiple 401 handling
}



interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setToken: (token: string | null) => void;
  initAuth: () => Promise<void>;
  login: (phoneNumber: string) => Promise<any>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<any>;
  resendOtp: (phoneNumber: string) => Promise<any>;
  clearError: () => void;
  logout: () => Promise<void>;
  handle401Error: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  // signupData: null,
  token: null,
  isHandling401: false,

  // Actions
  setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setError: (error: string | null) => set({ error }),

  setToken: (token: string | null) => set({ token }),

  initAuth: async () => {
    try {
      console.log('authStore: initAuth called');
      const storedToken = await AsyncStorage.getItem(STRINGS.AUTH_TOKEN);
      console.log('authStore: Retrieved token from AsyncStorage:', storedToken ? 'present' : 'null');
      if (storedToken) {
        console.log('authStore: Setting authenticated state with token');
        set({
          isAuthenticated: true,
          token: storedToken,
        });
      } else {
        console.log('authStore: No token found, setting unauthenticated state');
        set({
          isAuthenticated: false,
          token: null,
        });
      }
      console.log('authStore: initAuth completed successfully');
    } catch (error) {
      console.error('authStore: Error initializing auth:', error);
      set({ isAuthenticated: false, token: null });
    }
  },

  login: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      // Import authService dynamically to avoid circular dependency
      const { authService } = await import('../../services/authService');
      const response = await authService.login(phoneNumber);
      if (response.success && response.data) {
        // Store token for OTP verification
        set({
          token: response.data.data?.token || '',
          isLoading: false
        });
        return response;
      } else {
        set({
          error: response.error || 'Failed to send OTP',
          isLoading: false
        });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send OTP',
        isLoading: false
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send OTP' };
    }
  },

  verifyOtp: async (phoneNumber: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      // Import authService dynamically to avoid circular dependency
      const { authService } = await import('../../services/authService');
      const token = await AsyncStorage.getItem(STRINGS.FCM_TOKEN); // AsyncStorage removed - FCM token handling removed
      const response = await authService.verifyOtp(phoneNumber, parseInt(otp), token);
      if (response.success && response.data) {
        const authToken = response.data.data?.token || '';
        const isNew = response.data.data?.is_new || false;

        set({
          isAuthenticated: true,
          token: authToken,
          isLoading: false
        });

        // Store token and isLogin in AsyncStorage
        await AsyncStorage.setItem(STRINGS.AUTH_TOKEN, authToken);
        if (!isNew) {
          await AsyncStorage.setItem(STRINGS.IS_LOGIN, 'true');
        }

        // Fetch profile data after successful OTP verification only if user is not new
        if (!isNew) {
          try {
            const { useCommonStore } = await import('./commonStore');
            await useCommonStore.getState().getProfile();
          } catch (profileError) {
            console.error('Failed to fetch profile after OTP verification:', profileError);
            // Don't fail the OTP verification if profile fetch fails
          }
        }

        return { ...response, isNew };
      } else {
        set({
          error: response.error || 'OTP verification failed',
          isLoading: false
        });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'OTP verification failed',
        isLoading: false
      });
      return { success: false, error: error instanceof Error ? error.message : 'OTP verification failed' };
    }
  },

  resendOtp: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      // Import authService dynamically to avoid circular dependency
      const { authService } = await import('../../services/authService');
      const response = await authService.resendOtp(phoneNumber);
      if (response.success) {
        set({ isLoading: false });
        return response;
      } else {
        set({
          error: response.error || 'Failed to resend OTP',
          isLoading: false
        });
        return response;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
        isLoading: false
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to resend OTP' };
    }
  },


  clearError: () => set({ error: null }),

  logout: async () => {
    try {
      await AsyncStorage.clear(); // Clear all local storage
      // Set onboarding as completed to true so user goes to login
      await AsyncStorage.setItem(STRINGS.ONBOARDING_COMPLETED, 'true');
      set({
        user: null,
        isAuthenticated: false,
        token: null,
        error: null,
        isHandling401: false, // Reset the flag
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  // Global 401 handler to prevent multiple simultaneous logouts
  handle401Error: async () => {
    const state = get();
    if (state.isHandling401) {
      console.log('401 already being handled, skipping');
      return;
    }

    console.log('Handling 401 error - clearing storage and navigating to login');
    set({ isHandling401: true });

    try {
      await AsyncStorage.clear();
      await AsyncStorage.setItem(STRINGS.ONBOARDING_COMPLETED, 'true');
      set({
        user: null,
        isAuthenticated: false,
        token: null,
        error: null,
        isHandling401: false,
      });

      // Instead of throwing error, just log and let the app handle navigation naturally
      // The next API call or navigation will redirect to login due to cleared storage
      console.log('401 handled successfully - storage cleared, user will be redirected to login');
    } catch (error) {
      console.error('Error handling 401:', error);
      set({ isHandling401: false });
    }
  },
}));