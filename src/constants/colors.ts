// src/constants/colors.ts
/**
 * 🌈 Centralized color definitions for the app
 * All colors are in uppercase and duplicates have been removed
 */

export const COLORS = {
  // Primary Colors
  PRIMARY: '#000000',
  SECONDARY: '#FFFFFF',
  OFFER_BACKGROUND: '#ECF0FE',
  OFFER_BORDER: '#ADC3FE',
  // Basic Colors
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  ERROR: '#FF4136',
  ERROR_TOAST: '#BB1F15',
  LOGOUT_TEXT: '#BB1F15',
  GREEN: '#4CAF50',
  ICON_GREEN: '#C6FFC6',
  INPUT_TEXT: '#292929',
  GRADIENT_GREEN: '#74C38D',

  // Gray Scale
  GRAY: '#666666',
  GRAY_LIGHT: '#999999',
  GRAY_MEDIUM: '#BDBDBD',
  GRAY_DARK: '#CCCCCC',
  DARK_GRAY: '#222222',
  LIGHT_GRAY: '#DDDDDD',
  LIGHT_GRAY_2: '#E0E0E0',
  LIGHT_GRAY_3: '#EEEEEE',
  BOTTOM_BLACK: '#1D1D1D',
  LOGIN_SUBTITLE: '#404040',
  NEUTRAL_WHITE: '#BABABA',
  LOCATION_TEXT: '#0F1112',
  STEP_INDICATOR_ACTIVE: '#04F604',
  // Theme Colors
  THEME_GREEN: '#038203',
  LIGHT_GREEN: '#C8E6C9',
  DARK_GREEN: '#388E3C',
  DARK_GREEN_1: '#1B802F',
  SUCCESS: '#28A745',
  NOTE_TEXT: '#717171',

  // Special Colors
  TRANSPARENT: 'transparent',

  // Onboarding Colors
  ONBOARDING_BG_LIGHT: '#E8F5E9',
  ONBOARDING_DOT_INACTIVE: '#86FF86',
  ONBOARDING_BUTTON: '#038203', // Same as THEME_GREEN but kept for semantic clarity

  // Component Specific Colors
  LOADER: '#784E4E',
  PLACEHOLDER: '#AF6666',
  BORDER_LIGHT: '#F0F0F0',
  BORDER_INPUT: '#D9D9D9',
  CARD_BACKGROUND: '#F6F6F6',
  BUTTON_BACKGROUND: '#FCFCFC',
  DISCOUNT_BADGE: '#007BFF',
  DISCOUNT_TEXT: '#1A73DA',
  TEXT_PRIMARY: '#111111',
  TEXT_SECONDARY: '#1D1D1D',
  TEXT_MUTED: '#D1D1D1',
  TEXT_GRAY: '#595959',
  SEPARATOR: '#D1D1D1',
  BORDER: '#E5E5E5',
  EXPRESS_TEXT: '#393939',
  EXPRESS_BACKGROUND: '#FFF3A1',
  EXPRESS_BORDER: '#D0C11A',

  // Gradient Colors
  GRADIENT_START: '#74C38D',
  GRADIENT_LIGHT_START: '#E6F4EA',
  GRADIENT_YELLOW: '#F1DF1F',

  // Status Bar
  STATUS_BAR_BG: '#E6F4EA',
  DASHED_BORDER: '#8A8A8A',

  // Toast Colors
  TOAST_ERROR_BG: '#FF4444',

  // Duty Toggle Colors
  DUTY_ONLINE: '#16A34A',
  DUTY_OFFLINE: '#EF4444',
  DUTY_BACKGROUND: '#111827',
  DUTY_TRACK_LIGHT: '#E6E7EA',
  DUTY_LABEL: '#0F172A',
  DUTY_TEXT: '#6B7280',
  DUTY_GRADIENT_ONLINE_START: '#1FAA59',
  DUTY_GRADIENT_ONLINE_END: '#A8E6CF',
  DUTY_GRADIENT_OFFLINE_START: '#2C3E50',
  DUTY_GRADIENT_OFFLINE_END: '#BDC3C7',
  DUTY_SHADOW_ONLINE: '#43E97B',
  DUTY_SHADOW_OFFLINE: '#FF5858',

  // Route Map
  ROUTE_STROKE: '#4220BE',

  // Overlays
  DROPDOWN_OVERLAY: '#000000', // Same as BLACK but kept for semantic clarity
  LOADER_OVERLAY: '#000000', // Same as BLACK but kept for semantic clarity

  // Custom Button
  BUTTON_DISABLED: '#A0A0A0',

  // Phone Input
  PHONE_PLACEHOLDER: '#9AA0A6',

  // Additional colors for backward compatibility
  BACKGROUND: '#F5F5F5', // Added for existing usage
  TEXT: '#333333', // Added for existing usage
} as const;

// Font families
export const FONTFAMILY = {
  INTER_REGULAR: 'Inter-Regular',
  INTER_MEDIUM: 'Inter-Medium',
  INTER_SEMIBOLD: 'Inter-SemiBold',
  INTER_BOLD: 'Inter-Bold',
} as const;
