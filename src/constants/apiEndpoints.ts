// API Endpoints configuration for maintainability and easy updates

export const API_ENDPOINTS = {
  // Base URLs
  BASE_URL: 'cu/vendor', //local
  //BASE_URL: 'http://13.204.157.24:3000/vendor', // development http://192.168.1.29:3000/
  SOCKET_BASE_URL: 'http://192.168.0.127:3000/', //local
  LOGIN: '/login',
  OTPVERIFY: '/verify-otp',
  REGISTER: '/register',
} as const;

export const SOCKET_ENDPOINTS = {
  VENDOR_ORDER: 'vendor-order',
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

// Common headers
export const API_HEADERS = {
  JSON: {
    'Content-Type': 'application/json',
  },
  FORM_DATA: {
    'Content-Type': 'multipart/form-data',
  },
} as const;

// API Response Status
export const API_STATUS = {
  SUCCESS: true,
  ERROR: false,
} as const;
