// src/api/axios.ts
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { showErrorToast } from '../../utils/Toast';
import { useDialogStore } from '../store/useDialogStore';

const api = axios.create({
  // baseURL: 'http://13.204.157.24:3000',
  baseURL: 'http://192.168.0.127:3000',
  timeout: 10000,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔥 LOG REQUEST
  console.log(
    `%c[API REQUEST]  ${config.baseURL} ${config.method?.toUpperCase()} ${config.url}  ${token ? 'Token Present' : 'Token Absent'} \n ${token} `,
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
    console.log(
      `%c[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
      "color: #2ecc71; font-weight: bold;"
    );
    console.log("⬅ Response:", response.data);

    return response;
  },

  async error => {
    // 🔥 LOG ERROR RESPONSE
    console.log(
      `%c[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`,
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
