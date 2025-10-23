// src/api/axios.ts
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { showErrorToast } from '../../utils/Toast';
import { useDialogStore } from '../store/useDialogStore';

const api = axios.create({
  baseURL: 'http://13.204.157.24:3000', // replace with your API
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});



api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const { showDialog } = useDialogStore.getState();

      showDialog(
        'Session Expired',
        'Invalid or Token Expired',
        'Close',
        require('../../assets/background/bg.png')
      );
    }
    return Promise.reject(error);
  }
);

export default api;
