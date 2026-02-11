# LaundryUserApp

A comprehensive React Native application for laundry services, implementing Clean Architecture principles with authentication, order management, vendor details, and real-time updates.

## Architecture Overview

This application follows Clean Architecture principles with clear separation of concerns:

- **Presentation Layer**: Screens and components
- **Domain Layer**: Business logic and state management
- **Data Layer**: Services and API interactions

## Project Structure

```
src/
├── assets/              # Static assets
│   ├── auto-generated-svg-icons/  # Auto-generated SVG icon components
│   ├── bg/              # Background images
│   ├── icons/           # PNG icons
│   └── svg/             # Source SVG files
├── components/          # Reusable UI components
│   ├── BottomSheet/     # Bottom sheet component
│   ├── CustomBtn.tsx    # Custom button component
│   ├── CustomSwitch/    # Custom switch/toggle component
│   ├── CustomToast/     # Toast notification component
│   ├── Dialog/          # Dialog/Modal component
│   ├── DraggableSlider/ # Draggable slider component
│   ├── DutyToggle/      # Duty toggle component
│   ├── EmptyScreen/     # Empty state component
│   ├── GradientIcon/    # Gradient icon component
│   ├── Icon/            # Icon wrapper component
│   ├── Image/           # Custom image component
│   ├── LogoutDialog/    # Logout confirmation dialog
│   ├── NotificationCard/ # Notification card component
│   ├── ProfileInput/    # Profile input component
│   ├── RouteMap/        # Route map component
│   ├── Text/            # Custom text component
│   ├── TextInput/       # Custom text input component
│   ├── Toolbar/         # Toolbar/header component
│   ├── AddressCard.tsx
│   ├── CountryCodeDropdown.tsx
│   ├── CustomSkeleton.tsx
│   ├── DeliveryCard.tsx
│   ├── DetailCard.tsx
│   ├── ErrorHandle.tsx
│   ├── LaundryItemCard.tsx
│   ├── Loader.tsx
│   └── Map.tsx
├── constants/          # App constants
│   ├── apiEndpoints.ts  # API endpoint definitions
│   ├── colors.ts        # Color constants
│   ├── fonts.ts         # Font family constants
│   ├── icons.ts         # Icon constants
│   ├── navigationTexts.ts # Navigation text constants
│   ├── strings.ts       # String constants
│   ├── tripStatus.ts    # Trip/Order status constants
│   └── index.ts         # Constants exports
├── screens/            # Screen components
│   ├── Auth/           # Authentication screens
│   │   ├── Login/      # Login screen
│   │   ├── OTPVerification/ # OTP verification screen
│   │   └── ProfileData/ # Profile data screen
│   ├── Home/           # Home screen
│   │   └── styles/     # Home screen styles
│   ├── OnBoarding/     # Onboarding screen
│   ├── OrderReview/    # Order review screen
│   ├── Orders/         # Orders screens
│   │   ├── completedOrder/ # Completed order details
│   │   └── component/  # Order-related components
│   │       └── OrderCard.tsx
│   ├── Profile/       # Profile screen
│   │   └── SubScreens/ # Profile sub-screens
│   ├── ServiceList/   # Service list screen
│   ├── Splash/        # Splash screen
│   └── VendorDetail/  # Vendor detail screen
│       └── Services/  # Service components
├── state/              # State management
│   └── zustand/       # Zustand stores
│       └── [4 store files]
├── store/             # Additional store
│   └── useStore.ts
├── services/          # API services
│   ├── Notification/  # Notification services
│   ├── Socket/        # WebSocket services
│   ├── addressService.ts
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── commonService.ts
│   └── queryClient.ts
├── hooks/             # Custom hooks
│   ├── useLoading.ts
│   └── useToast.ts
├── utils/             # Utility functions
│   ├── apiTest.ts
│   ├── index.ts
│   ├── network.ts
│   ├── responsive.ts
│   ├── sessionHandler.ts
│   ├── storage.ts
│   ├── theme.ts
│   ├── toast.ts
│   └── validation.ts
├── types/             # TypeScript type definitions
│   ├── AppTypes.ts
│   ├── auth/          # Authentication types
│   ├── profile/       # Profile types
│   ├── services/      # Service types
│   └── socket/        # Socket types
├── navigation/        # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── BottomMainNavigator.tsx
├── styles/           # Shared styles
│   └── shared.ts
└── mock/             # Mock data
    └── mockData.ts
```

## Key Features

### ✅ Implemented Features

- **Clean Architecture**: Modular, testable, and maintainable code structure
- **State Management**: Zustand for efficient state management with persistence
- **Data Fetching**: React Query for caching and background updates
- **Navigation**: React Navigation with native stack and bottom tab navigators
- **Authentication Flow**:
  - Onboarding screen with welcome message
  - Mobile number login with OTP verification
  - Profile data collection
  - Error handling and loading states
- **Order Management**:
  - Order list with active and completed orders
  - Order details screen with status tracking
  - Order review and confirmation
  - Order history
- **Vendor Services**:
  - Vendor listing and details
  - Service types (Wash, Iron, Dry Cleaning, etc.)
  - Service pricing and selection
  - Vendor ratings and reviews
- **Real-time Updates**: WebSocket integration for live order status
- **Notifications**: Push notifications and in-app notifications
- **Location Services**: Address management and location selection
- **UI/UX**:
  - **Theme System**: Custom theme with green gradient backgrounds and consistent colors
  - **Responsive Design**: Adaptive layout for all mobile screens (Android & iOS)
  - **Flexible Components**: Reusable components with consistent styling
  - **Professional Styling**: Clean, modern interface following Material Design principles
  - **Empty States**: Empty screen components for better UX
- **Type Safety**: Full TypeScript implementation
- **Validation**: Input validation utilities for forms
- **Error Handling**: Comprehensive error management

### 🔧 Technologies Used

- **React Native 0.81.4**
- **TypeScript**
- **Zustand** - State management
- **@tanstack/react-query** - Data fetching and caching
- **@react-navigation/native** - Navigation (Stack & Bottom Tabs)
- **react-native-linear-gradient** - Gradient backgrounds
- **react-native-vector-icons** - Icon library
- **react-native-svg** - SVG support
- **socket.io-client** - WebSocket client for real-time updates
- **@notifee/react-native** - Push notifications
- **React Native Safe Area Context** - Safe area handling

## Usage

### Authentication Flow

1. **Onboarding**: Welcome screen with continue button
2. **Login**: Mobile number input with validation
3. **Authentication**: API call simulation with loading states
4. **Success**: User authentication and state persistence

### State Management

```typescript
import { useAuthStore } from './src/state/zustand/authStore';

const { user, isAuthenticated, login, logout } = useAuthStore();
```

### Custom Hooks

```typescript
import { useAuth } from './src/hooks/useAuth';

const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();
```

## API Integration

The `authService.ts` provides methods for authentication:

- `login(request)` - Authenticate user
- `sendOtp(phoneNumber)` - Send OTP (mock implementation)
- `verifyOtp(phoneNumber, otp)` - Verify OTP (mock implementation)
- `logout()` - Logout user

Replace mock implementations with actual API calls.

## Validation

Phone number validation using E.164 format:

```typescript
import { validatePhoneNumber } from './src/utils/validation';

const isValid = validatePhoneNumber('+1234567890');
```

## Navigation

The app uses multiple navigators:

- **Auth Navigator**: Authentication flow (Splash → Onboarding → Login → OTP → Profile)
- **App Navigator**: Main app navigation wrapper
- **Bottom Navigator**: Main tabs (Home, Orders, Profile)
- **Stack Navigators**: Nested navigation for screens like Vendor Detail, Order Details, etc.

## Styling

- Responsive design with flexbox
- Dark mode support using `useColorScheme`
- Consistent spacing and typography
- Accessible color contrast

## Performance Optimizations

- **React Performance**: useCallback, useMemo, and React.memo for optimized re-renders
- **React Query**: Efficient caching and background updates for API responses
- **Zustand**: Lightweight state management with persistence
- **Responsive Design**: Device-aware scaling to prevent unnecessary calculations
- **Code Splitting**: Modular imports and organized file structure
- **Memory Optimization**: Proper cleanup and efficient component lifecycle

## Testing

The module is structured for easy testing:

- Pure functions in utilities
- Separated business logic in stores
- Mockable services
- Component isolation

## Future Enhancements

- OTP verification screen
- Biometric authentication
- Social login integration
- Multi-language support
- Offline authentication
- Password recovery

## Development

1. Install dependencies: `npm install`
2. Start Metro: `npm start`
3. Run on device/emulator: `npm run android` or `npm run ios`

## Code Quality

- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Clean code principles
- SOLID design patterns