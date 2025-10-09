// src/api/index.ts
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// export const apiClient = axios.create({
//   baseURL: 'http://13.204.157.24:3000/vendor/', // common base URL
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

const apiClient = axios.create({
  baseURL: 'https://your.api.url',
});

apiClient.interceptors.request.use(async config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
