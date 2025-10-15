// src/api/axios.ts
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: 'http://192.168.1.29:3000', // replace with your API
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
