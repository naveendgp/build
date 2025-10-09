import { create } from 'zustand';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from './index';
import NetInfo from '@react-native-community/netinfo';

interface ApiState {
  data: any;
  loading: boolean;
  error: string | null;
  status: boolean | null; // ✅ renamed from success → status
  request: (config: AxiosRequestConfig) => Promise<void>;
  reset: () => void;
}

export const useApiStore = create<ApiState>(set => ({
  data: null,
  loading: false,
  error: null,
  status: null,

  request: async (config: AxiosRequestConfig) => {
    set({ loading: true, error: null, status: null });

    // Check for network connectivity before making the request
    const netInfoState = await NetInfo.fetch();
    if (!netInfoState.isConnected) {
      set({
        error:
          'No internet connection. Please check your network and try again.',
        status: false,
        loading: false,
      });
      return; // Stop if offline
    }

    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
      config.data,
    );

    try {
      const response = await apiClient(config);
      console.log('[API Response]', response.data);

      // ✅ Consider 200 & 201 as success
      const isSuccess =
        response.status === 200 ||
        response.status === 201 ||
        response.data?.status === true;

      set({
        data: response.data,
        status: isSuccess,
        loading: false,
        error: isSuccess ? null : `Unexpected status: ${response.status}`,
      });
    } catch (err: any) {
      console.error('[API Error]', err.response?.data.message);
      const message =
        err.response?.data?.message || err.message || 'Something went wrong';

      set({
        error: message,
        status: false,
        loading: false,
      });
    }
  },

  reset: () => set({ data: null, loading: false, error: null, status: null }),
}));
