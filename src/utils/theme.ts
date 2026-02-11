export const theme = {
    colors: {
    primary: '#001f3f', // Navy Blue
    background: '#FFFFFF', // White
    accent: '#FF4136', // Red
    subtle: '#DDDDDD', // Light Gray
    text: {
      primary: '#001f3f',
      secondary: '#666666',
      light: '#999999',
    },
    border: '#DDDDDD',
    error: '#FF4136',
    success: '#28a745',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    fontFamily: {
      REGULAR: 'Poppins-Regular',
      MEDIUM: 'Poppins-Medium',
      SEMIBOLD: 'Poppins-SemiBold',
      BOLD: 'Poppins-Bold',
    }
  },
} as const;

export type Theme = typeof theme;