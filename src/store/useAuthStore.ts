import { create } from 'zustand';

interface SignupData {
  token: string;
  isNewUser: boolean;
  phone: string;
  userType: string;
}

interface AuthState {
  isLoading: boolean;
  error: string | null;
  signupData: SignupData | null;
  token: string | null;
}

interface AuthActions {
  login: (phone: string) => Promise<any>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(set => ({
  isLoading: false,
  error: null,
  signupData: null,
  token: null,

  login: async (phone: string) => {
    set({ isLoading: true, error: null });
    console.log('Logging in with phone number:', phone);

    try {
      const { authService } = await import('../api/authApi');
      const response = await authService.login(phone);

      console.log('Send OTP response:', response);

      if (response.status != null && String(response.status) !== 'false') {
        set({
          signupData: {
            token: response.data?.token || '',
            isNewUser: response.data?.isNewUser || false,
            phone: phone,
            userType: 'driver', // Default user type
          },
          token: response.data?.token || '',
          isLoading: false,
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

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),
}));

// import { create } from 'zustand';

// export interface User {
//   id: string;
//   phone: string;
//   name?: string;
//   userType?: string;
//   isNewUser?: boolean;
// }

// interface AuthState {
//   user: User | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: string | null;
//   signupData: SignupData | null; // Store signup response for OTP verification
//   token: string | null; // Store authentication token
// }

// interface SignupData {
//   token: string;
//   isNewUser: boolean;
//   phone: string;
//   userType: string;
// }

// interface AuthActions {
//   setUser: (user: User | null) => void;
//   setLoading: (loading: boolean) => void;
//   setError: (error: string | null) => void;
//   setToken: (token: string | null) => void;
//   login: (phone: string) => Promise<any>;
//   verifyOtp: (phone: string, otp: string) => Promise<void>;
//   // login: (phoneNumber: string, countryCode?: string) => Promise<void>;
//   logout: () => void;
//   clearError: () => void;
// }

// type AuthStore = AuthState & AuthActions;

// export const useAuthStore = create<AuthStore>()((set, get) => ({
//   // Initial state
//   user: null,
//   isAuthenticated: false,
//   isLoading: false,
//   error: null,
//   signupData: null,
//   token: null,

//   // Actions
//   setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),

//   setLoading: (isLoading: boolean) => set({ isLoading }),

//   setError: (error: string | null) => set({ error }),

//   setToken: (token: string | null) => set({ token }),

//   login: async (phone: string) => {
//     set({ isLoading: true, error: null });
//     console.log('Logging in with phone number:', phone);
//     try {
//       // Import authService dynamically to avoid circular dependency
//       const { authService } = await import('../api/authApi');
//       const response = await authService.login(phone);
//       console.log('Send OTP response :', response.status, response.data);
//       console.log('Send OTP response:', response);
//       if (response.status != null && String(response.status) !== 'false') {
//         // Store signup data for OTP verification
//         set({
//           signupData: {
//             token: response.data?.token || '',
//             isNewUser: response.data?.isNewUser || false,
//             phone: phone,
//             userType: 'driver', // Default user type
//           },
//           token: response.data?.token || '',
//           isLoading: false,
//         });
//       } else {
//         set({
//           error: response.message || 'Failed to send OTP',
//           isLoading: false,
//         });
//       }
//       return response;
//     } catch (error) {
//       set({
//         error: error instanceof Error ? error.message : 'Failed to send OTP',
//         isLoading: false,
//       });
//       throw error; // Re-throw for network errors
//     }
//   },

//   verifyOtp: async (phone: string, otp: string) => {
//     const { signupData } = get();
//     if (!signupData) {
//       throw new Error('Signup data not found. Please try logging in again.');
//     }

//     set({ isLoading: true, error: null });
//     try {
//       // Import authService dynamically to avoid circular dependency
//       const { authService } = await import('../api/authApi');
//       const response = await authService.verifyOtp(signupData, parseInt(otp));
//       if (response.status != null && String(response.status) !== 'false') {
//         const user: User = {
//           id: response.data?.phone || '',
//           phone: response.data?.phone || '',
//           name: undefined,
//           userType: 'driver',
//           isNewUser: response.data?.isNewUser,
//         };
//         set({
//           user,
//           isAuthenticated: true,
//           signupData: null, // Clear signup data after successful verification
//           token: response.data?.token || '',
//           isLoading: false,
//         });
//       } else {
//         set({
//           error: response.message || 'OTP verification failed',
//           isLoading: false,
//         });
//         throw new Error(response.message || 'OTP verification failed');
//       }
//     } catch (error) {
//       set({
//         error:
//           error instanceof Error ? error.message : 'OTP verification failed',
//         isLoading: false,
//       });
//       throw error;
//     }
//   },

//   logout: async () => {
//     try {
//       // Import authService dynamically to avoid circular dependency
//       const { authService } = await import('../api/authApi');
//       await authService.logout();
//     } catch (error) {
//       // Even if logout fails on server, clear local state
//       console.error('Logout error:', error);
//     } finally {
//       set({
//         user: null,
//         isAuthenticated: false,
//         token: null,
//         error: null,
//       });
//     }
//   },

//   clearError: () => set({ error: null }),
// }));
