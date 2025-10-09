// src/api/index.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://13.204.157.24:3000/vendor/', // common base URL
  headers: {
    'Content-Type': 'application/json',
  },
});
