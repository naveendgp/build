import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const responsive = {
  // Scale width based on screen width
  width: (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size,

  // Scale height based on screen height
  height: (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size,

  // Scale font size
  fontSize: (size: number) => {
    const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  // Scale spacing
  spacing: (size: number) => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  },

  // Get screen dimensions
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,

  // Check if device is tablet
  isTablet: SCREEN_WIDTH >= 768,

  // Check if device is small screen
  isSmallScreen: SCREEN_WIDTH < 375,

  // Platform specific values
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};