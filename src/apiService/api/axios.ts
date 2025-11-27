// src/api/axios.ts
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { showErrorToast } from '../../utils/Toast';
import { useDialogStore } from '../store/useDialogStore';

const api = axios.create({
  // baseURL: 'http://192.168.0.144:3000',
  baseURL: 'http://13.201.170.46:3000',
  timeout: 10000,
});

// Helper function to build full URL with query parameters
const buildFullUrl = (config: any): string => {
  let url = config.url || '';

  // If URL already starts with http, it's already a full URL
  if (url.startsWith('http')) {
    return url;
  }

  // Build base URL + path
  const baseUrl = config.baseURL || '';
  const fullUrl = `${baseUrl}${url}`;

  // Add query parameters if they exist
  if (config.params) {
    const params = new URLSearchParams();
    Object.keys(config.params).forEach(key => {
      if (config.params[key] !== undefined && config.params[key] !== null) {
        params.append(key, config.params[key]);
      }
    });
    const queryString = params.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  return fullUrl;
};

// REQUEST INTERCEPTOR
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔥 LOG REQUEST
  const fullUrl = buildFullUrl(config);
  console.log(
    `%c[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl} ${token ? token : 'Token Absent'}`,
    "color: #3498db; font-weight: bold;"
  );
  console.log("➡ Payload:", config.data);
  console.log("➡ Params:", config.params);

  return config;
});

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  response => {
    // 🔥 LOG SUCCESS RESPONSE
    const fullUrl = buildFullUrl(response.config);

    console.log(
      `%c[API RESPONSE] ${response.config.method?.toUpperCase()} ${fullUrl} - ${response.status}`,
      "color: #2ecc71; font-weight: bold;"
    );
    console.log("⬅ Response:", response.data);

    return response;
  },

  async error => {
    // 🔥 LOG ERROR RESPONSE
    const fullUrl = error.config ? buildFullUrl(error.config) : 'Unknown URL';

    console.log(
      `%c[API ERROR] ${error.config?.method?.toUpperCase()} ${fullUrl} - ${error.response?.status}`,
      "color: #e74c3c; font-weight: bold;"
    );
    console.log("❌ Error Response:", error.response?.data);
    console.log("❌ Error Object:", error);

    // 401 HANDLE
    if (error.response?.status === 401) {
      const { showDialog } = useDialogStore.getState();
      const { logout } = useAuthStore.getState();

      setTimeout(() => {
        showDialog(
          "Session Expired",
          "Your session has expired. Please login again.",
          "OK",
          require('../../assets/background/bg.png'),
          () => {
            logout();
            useDialogStore.getState().hideDialog();
          },
          false // Not closable - user must click OK button
        );
      }, 100);
    }

    return Promise.reject(error);
  }
);

export default api;
