// API Endpoints configuration for maintainability and easy updates

export const API_ENDPOINTS = {
  // Base URLs
  // BASE_URL: 'http://192.168.1.46:3000', //local
  BASE_URL: 'http://13.204.157.24:3000/vendor', // development

  LOGIN: '/login',
  OTPVERIFY: '/verify-otp',
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
