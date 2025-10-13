import { create } from 'zustand';

interface SignupData {
  token?: string;
  isNewUser?: boolean;
  phone?: string;
  userType?: string;
  successMsg?: string;
}

interface AuthState {
  isLoading: boolean;
  error: string | null;
  signupData: SignupData | null; // contains phone after login
  token: string | null;
}

interface AuthActions {
  login: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, otp: string) => Promise<any>;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(set => ({
  isLoading: false,
  error: null,
  signupData: null,
  token: null,

  // 1️⃣ Send OTP
  login: async (phone: string) => {
    set({ isLoading: true, error: null });
    console.log('Logging in with phone number:', phone);

    try {
      const { authService } = await import('../api/authApi');
      const response = await authService.login(phone);

      console.log('Send OTP response:', response);

      if (response.status) {
        set({
          isLoading: false,
          signupData: { phone, successMsg: response.message }, // ✅ Save phone number here
        });
      } else {
        set({
          error: response.message || 'Failed to send OTP',
          isLoading: false,
        });
      }

      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send OTP',
        isLoading: false,
      });
      throw error;
    }
  },

  // 2️⃣ Verify OTP (Response contains only token)
  verifyOtp: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    console.log('Verifying OTP for:', phone);

    try {
      const { authService } = await import('../api/authApi');
      const response = await authService.verifyOtp(phone, otp);

      console.log('Verify OTP response:', response);

      if (response.status && response.data?.token) {
        set(state => ({
          token: response.data?.token,
          isLoading: false,
          signupData: {
            ...state.signupData,
            token: response.data?.token, // ✅ update token in signupData too
            successMsg: response.message,
          },
        }));
      } else {
        set({
          error: response.message || 'Invalid OTP',
          isLoading: false,
        });
      }

      return response;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'OTP verification failed',
        isLoading: false,
      });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  logout: () => set({ token: null, signupData: null }),
}));
