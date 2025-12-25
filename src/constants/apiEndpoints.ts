// API Endpoints configuration for maintainability and easy updates

export const API_ENDPOINTS = {
  // Base URLs
  BASE_URL: 'https://api.otterlaundry.com',
  SOCKET_BASE_URL: 'https://api.otterlaundry.com/',

  LOGIN: '/login',
  OTPVERIFY: '/verify-otp',
  REGISTER: '/register',
  ORDERS: '/vendor/orders',
  COMPLETE_ORDER: '/vendor/order/complete',
  ACCEPT_ORDER: '/vendor/order/accept',
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
