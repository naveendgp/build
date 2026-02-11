// API Endpoints configuration for maintainability and easy updates

export const API_ENDPOINTS = {
  // Base URLs
  //BASE_URL: 'https://adah-rotatory-evelina.ngrok-free.dev/user', //local

  BASE_URL: 'https://api.otterlaundry.com/user',// development

  SOCKET_BASE_URL: 'https://api.otterlaundry.com',
  // BASE_URL: 'http://52.66.215.132:3000/user',
  // API_ROOT_URL: 'http://52.66.215.132:3000',

  // SOCKET_BASE_URL: 'http://52.66.215.132:3000',

  LOGIN: '/auth',
  OTPVERIFY: '/verify-otp',
  RESEND_OTP: '/resend-otp',
  LOGOUT: '/logout',
  PROFILE: '/me',
  UPDATE_AVAILABILITY: '/delivery/update-availability',
  LIST_SERVICES: '/list-services',
  LIST_VENDORS: '/vendors',
  FILTER_LIST: '/services/filter-list',
  EDIT_ADDRESS: '/edit-address',
  REMOVE_ADDRESS: '/remove-address',
  ADD_ADDRESS: '/add-address',
  UPDATE_PROFILE: '/update-profile',
  VENDOR_DETAILS: '/vendor/details',
  PLACE_ORDER: '/make-order',
  ORDER_PREVIEW: '/preview-order',
  ORDERS: '/orders',
  ORDER_DETAIL: '/order',
  CANCEL_ORDER: '/cancel-order',
  VENDOR_REVIEWS: '/vendor',
  NOTIFICATIONS: '/notifications',
  MAKE_PAYMENT: '/make-payment',
  CREATE_REVIEW: '/create-review',
  CHANGE_PAYMENT_METHOD: '/change-payment-method',
  // Offer endpoints
  USER_OFFERS: '/offer/user-offers',
  VALIDATE_COUPON: '/offer/validate',
  APPLY_COUPON: '/offer/apply',
} as const;



export const SOCKET_ENDPOINTS = {
  ORDER_STATUS: 'order-status',
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