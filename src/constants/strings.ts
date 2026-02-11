// App-wide string constants for maintainability and i18n readiness

export const STRINGS = {
  // Screen Titles
  LOGIN_TITLE: 'Login',
  VERIFY_OTP_TITLE: 'Verify OTP',

  // Screen Subtitles
  LOGIN_SUBTITLE: 'Enter your mobile number to continue',
  VERIFY_OTP_SUBTITLE: 'Enter the 6-digit code sent to',

  // Placeholders
  PHONE_NUMBER_PLACEHOLDER: 'Enter mobile number',
  OTP_PLACEHOLDER: 'Enter 4-digit OTP',

  // Button Labels
  LOGIN_BUTTON: 'Login',
  VERIFY_BUTTON: 'Verify',

  // Error Messages
  ERROR_ENTER_PHONE: 'Please enter your phone number',
  ERROR_INVALID_PHONE: 'Please enter a valid phone number',
  ERROR_INVALID_OTP: 'Please enter a valid 4-digit OTP',
  ERROR_FAILED_SEND_OTP: 'Failed to send OTP',
  ERROR_OTP_VERIFICATION_FAILED: 'OTP verification failed',

  // Success Messages
  SUCCESS_LOGIN: 'Login successful!',
  SUCCESS_OTP_VERIFIED: 'OTP verified successfully!',

  // Footer Text
  FOOTER_TERMS: 'By continuing, you agree to our Terms of Service and Privacy Policy',

  // OTP Screen
  OTP_RESEND_TEXT: 'Didn\'t receive the code? Resend OTP',

  // API Messages
  API_OTP_SENT: 'OTP sent successfully',

  // User Types
  USER_TYPE_DRIVER: 'driver',
  USER_TYPE_CUSTOMER: 'customer',

  // Loading States
  LOADING_SENDING_OTP: 'Sending OTP...',
  LOADING_VERIFYING_OTP: 'Verifying OTP...',

  // Validation
  VALIDATION_PHONE_REQUIRED: 'Phone number is required',
  VALIDATION_OTP_REQUIRED: 'OTP is required',
  VALIDATION_OTP_LENGTH: 'OTP must be 4 digits',

  // Notifications
  NOTIFICATIONS_TITLE: 'Notifications',
  NOTIFICATIONS_EMPTY_TITLE: 'No notifications',
  NOTIFICATIONS_EMPTY_SUBTITLE: 'You\'re all caught up! Check back later for new updates.',


  //Local storage
  FCM_TOKEN:'fcm_token',
  AUTH_TOKEN:'auth_token',
  IS_LOGIN:'is_login',
  ONBOARDING_COMPLETED:'onboarding_completed',
  IS_INIT_PROFILE_ADDRESS_UPDATED:'is_profile_updated',
} as const;

// Type for string keys
export type StringKey = keyof typeof STRINGS;