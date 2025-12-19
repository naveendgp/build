/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    LAUNDRY VENDOR APP - KNOWLEDGE TRANSFER                 ║
 * ║                         Project Documentation & Guide                       ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 *
 * Project Name: OtterPartner (Laundry Vendor App)
 * Platform: React Native (iOS & Android)
 * Version: 0.0.1
 * Last Updated: December 17, 2025
 *
 * ============================================================================
 * TABLE OF CONTENTS
 * ============================================================================
 * 1. Project Overview
 * 2. Technology Stack
 * 3. Project Architecture
 * 4. Directory Structure
 * 5. Core Features & Modules
 * 6. API Integration & Data Flow
 * 7. State Management
 * 8. Navigation Structure
 * 9. Third-Party Integrations
 * 10. Build & Deployment
 * 11. Development Workflow
 * 12. Troubleshooting & Common Issues
 * 13. Recent Updates & Changes
 * 14. Future Enhancements
 * ============================================================================
 */

/**
 * ============================================================================
 * 1. PROJECT OVERVIEW
 * ============================================================================
 * 
 * Purpose:
 * The Laundry Vendor App (OtterPartner) is a mobile application designed for 
 * laundry service vendors/partners to manage their operations, including:
 * - Receiving and processing customer orders
 * - Real-time order tracking and status updates
 * - Live navigation to customer locations
 * - Driver/vendor location tracking
 * - Service management and pricing
 * - Profile and verification management
 * - Invoice generation and downloads
 * - Push notifications for order updates
 * 
 * Target Users:
 * - Laundry service vendors/partners
 * - Drivers/delivery personnel
 * 
 * Business Model:
 * This is the vendor-side companion app for a laundry service platform,
 * handling order fulfillment, pickup, and delivery operations.
 */

/**
 * ============================================================================
 * 2. TECHNOLOGY STACK
 * ============================================================================
 * 
 * Core Framework:
 * - React Native: 0.80.0
 * - React: 19.1.0
 * - TypeScript: 5.0.4
 * - Node.js: >= 18
 * 
 * Key Dependencies:
 * 
 * Navigation:
 * - @react-navigation/native: ^7.1.18
 * - @react-navigation/native-stack: ^7.3.27
 * - @react-navigation/bottom-tabs: ^7.4.9
 * 
 * State Management:
 * - Zustand: ^5.0.8 (Lightweight state management)
 * - @tanstack/react-query: ^5.90.3 (Server state & caching)
 * 
 * API & Networking:
 * - Axios: ^1.12.2 (HTTP client)
 * - Socket.io-client: ^4.7.2 (Real-time communication)
 * 
 * Maps & Location:
 * - react-native-maps: ^1.26.17 (Map integration)
 * - @react-native-community/geolocation: ^3.4.0 (Location services)
 * 
 * Push Notifications:
 * - @notifee/react-native: ^9.1.8 (Local notifications)
 * - @react-native-firebase/app: ^23.5.0
 * - @react-native-firebase/messaging: ^23.5.0
 * 
 * UI/UX Libraries:
 * - react-native-svg: ^15.15.0 (SVG rendering)
 * - react-native-linear-gradient: ^2.8.3 (Gradients)
 * - react-native-reanimated: ^4.1.3 (Animations)
 * - react-native-gesture-handler: ^2.28.0 (Gestures)
 * - react-native-vector-icons: ^10.3.0 (Icons)
 * - react-native-haptic-feedback: ^2.3.3 (Haptic feedback)
 * 
 * Utilities:
 * - @react-native-async-storage/async-storage: ^2.2.0 (Local storage)
 * - @react-native-community/datetimepicker: ^8.5.0 (Date/time picker)
 * - @react-native-community/netinfo: ^11.4.1 (Network status)
 * - react-native-image-picker: ^8.2.1 (Image selection)
 * - react-native-blob-util: ^0.19.4 (File operations)
 * - react-native-webview: ^13.16.0 (WebView component)
 * 
 * Development Tools:
 * - @svgr/cli: ^8.1.0 (SVG to React component conversion)
 * - ESLint: ^8.19.0 (Code linting)
 * - Prettier: 2.8.8 (Code formatting)
 * - Jest: ^29.6.3 (Testing framework)
 */

/**
 * ============================================================================
 * 3. PROJECT ARCHITECTURE
 * ============================================================================
 * 
 * Architecture Pattern:
 * The app follows a modular, feature-based architecture with clear separation
 * of concerns:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                        App Entry                             │
 * │                      (App.tsx, index.js)                     │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      Providers Layer                         │
 * │  - QueryClientProvider (React Query)                         │
 * │  - SafeAreaProvider                                          │
 * │  - GestureHandlerRootView                                    │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Navigation Layer                          │
 * │  - AppNavigator (Stack Navigator)                            │
 * │  - BottomTabNavigator (Tab Navigator)                        │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *          ┌───────────────────┼───────────────────┐
 *          ▼                   ▼                   ▼
 * ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
 * │  Auth Screens   │ │  Main Screens   │ │ Profile Screens │
 * │  - Login        │ │  - Home         │ │  - Settings     │
 * │  - Verification │ │  - Orders       │ │  - Verification │
 * └─────────────────┘ └─────────────────┘ └─────────────────┘
 *          │                   │                   │
 *          └───────────────────┼───────────────────┘
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Business Logic Layer                      │
 * │  - Custom Hooks (useNotifications, etc.)                     │
 * │  - API Service Layer (apiService/)                           │
 * │  - State Management (Zustand stores)                         │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *          ┌───────────────────┼───────────────────┐
 *          ▼                   ▼                   ▼
 * ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
 * │   API Service   │ │  Socket Service │ │  Notifications  │
 * │  (REST/Axios)   │ │  (Socket.io)    │ │  (Firebase)     │
 * └─────────────────┘ └─────────────────┘ └─────────────────┘
 *
 * Key Design Principles:
 * 1. Component Reusability - Shared components in components/
 * 2. Feature Isolation - Features grouped in screens/
 * 3. Centralized State - Zustand stores for global state
 * 4. Server State Caching - React Query for API data
 * 5. Real-time Updates - Socket.io for live tracking
 * 6. Type Safety - TypeScript throughout
 */

/**
 * ============================================================================
 * 4. DIRECTORY STRUCTURE
 * ============================================================================
 * 
 * Root Directory:
 * ├── android/                  # Android native code
 * ├── ios/                      # iOS native code
 * ├── src/                      # Main application source
 * │   ├── apiService/           # API integration layer
 * │   │   ├── api/              # REST API calls
 * │   │   ├── socket/           # Socket.io connection
 * │   │   ├── store/            # Zustand state stores
 * │   │   └── types/            # TypeScript types for API
 * │   ├── assets/               # Static assets
 * │   │   ├── icons/            # Icon files
 * │   │   ├── images/           # Image files
 * │   │   └── auto-generated-svg-icons/  # SVG icons as components
 * │   ├── components/           # Reusable UI components
 * │   ├── constants/            # App constants & configuration
 * │   ├── navigation/           # Navigation configuration
 * │   │   ├── AppNavigator.tsx
 * │   │   └── BottomTabNavigator.tsx
 * │   ├── screens/              # Feature screens
 * │   │   ├── Auth/             # Authentication screens
 * │   │   ├── Home/             # Home/Dashboard screens
 * │   │   ├── Orders/           # Order management screens
 * │   │   ├── Profile/          # Profile & settings screens
 * │   │   ├── Services/         # Service management screens
 * │   │   ├── SplashScreen/     # Initial splash screen
 * │   │   └── VendorVerification/  # Vendor verification flow
 * │   ├── services/             # Business logic services
 * │   │   ├── Notification/     # Push notification handling
 * │   │   └── api/              # API configuration
 * │   ├── styles/               # Global styles
 * │   ├── types/                # Global TypeScript types
 * │   ├── utils/                # Utility functions
 * │   └── Test.ts               # THIS FILE - Project KT
 * ├── App.tsx                   # App entry point
 * ├── index.js                  # React Native entry
 * ├── package.json              # Dependencies
 * ├── tsconfig.json             # TypeScript config
 * ├── babel.config.js           # Babel config
 * ├── metro.config.js           # Metro bundler config
 * └── README.md                 # Setup instructions
 */

/**
 * ============================================================================
 * 5. CORE FEATURES & MODULES
 * ============================================================================
 * 
 * A. Authentication & Authorization
 * ----------------------------------
 * Location: src/screens/Auth/
 * Key Components:
 * - Login screen with phone authentication
 * - OTP verification
 * - Session management via Zustand store (useAuthStore)
 * - Auto-login with stored credentials
 * - Token-based API authentication
 * 
 * B. Vendor Verification
 * ----------------------
 * Location: src/screens/VendorVerification/
 * Features:
 * - Multi-step onboarding process
 * - Document upload (KYC)
 * - Profile location selection with Google Maps
 * - Business details submission
 * - Verification status tracking
 * 
 * Important Files:
 * - ProfileLocation.tsx: Map-based location selection
 *   - Uses react-native-maps
 *   - Google Maps API integration
 *   - Current location detection
 *   - Address geocoding
 * 
 * C. Order Management
 * -------------------
 * Location: src/screens/Orders/
 * Features:
 * - Order listing (Active, Pending, Completed)
 * - Order details view
 * - Order status updates
 * - Real-time order notifications
 * - Invoice download functionality
 * - Order filtering and search
 * 
 * Key Screens:
 * - ActiveOrderScreen: Live order tracking with map navigation
 * - CompletedOrderDetailsScreen: Past order details & invoice download
 * - OrderHistoryScreen: List of all orders
 * 
 * D. Live Tracking & Navigation
 * -----------------------------
 * Location: src/screens/Orders/ActiveOrderScreen
 * Features:
 * - Real-time driver/vendor location tracking
 * - Turn-by-turn navigation routes
 * - Socket.io integration for live updates
 * - Custom map markers (SVG icons)
 * - Dynamic route calculation
 * - Map view customization (satellite, standard)
 * - Zoom level management
 * 
 * Implementation:
 * - Uses react-native-maps for map rendering
 * - Socket.io for real-time location updates
 * - Google Maps Directions API for routes
 * - Custom SVG markers for vehicles/locations
 * 
 * E. Services Management
 * ----------------------
 * Location: src/screens/Services/
 * Features:
 * - Service catalog management
 * - Pricing configuration
 * - Service availability toggles
 * - Category management
 * 
 * F. Profile & Settings
 * ---------------------
 * Location: src/screens/Profile/
 * Features:
 * - Vendor profile management
 * - Business information editing
 * - Settings and preferences
 * - Logout functionality
 * 
 * G. Push Notifications
 * ---------------------
 * Location: src/services/Notification/
 * Features:
 * - Firebase Cloud Messaging (FCM) integration
 * - Local notifications with Notifee
 * - Notification handling (foreground/background)
 * - Deep linking from notifications
 * - Custom notification sounds and UI
 * 
 * Implementation:
 * - useNotifications hook in App.tsx
 * - FCM token management
 * - Notification permission handling
 * 
 * H. Invoice Download
 * -------------------
 * Location: src/screens/Orders/CompletedOrderDetailsScreen
 * Features:
 * - PDF invoice download from S3
 * - File system integration
 * - Download progress indication
 * - File sharing capabilities
 * 
 * Implementation:
 * - Uses react-native-blob-util
 * - Downloads from S3 URLs
 * - Saves to device storage
 */

/**
 * ============================================================================
 * 6. API INTEGRATION & DATA FLOW
 * ============================================================================
 * 
 * API Architecture:
 * 
 * The app uses a dual-communication approach:
 * 1. REST API (Axios) - For CRUD operations
 * 2. WebSocket (Socket.io) - For real-time updates
 * 
 * A. REST API Layer
 * -----------------
 * Location: src/apiService/api/
 * 
 * Configuration:
 * - Base URL configuration in constants
 * - Axios instance with interceptors
 * - Request/Response interceptors for:
 *   - Auth token injection
 *   - Error handling
 *   - Session management
 * 
 * React Query Integration:
 * - Query Client setup in src/services/api/queryClient.ts
 * - Used in App.tsx via QueryClientProvider
 * - Provides:
 *   - Automatic caching
 *   - Background refetching
 *   - Optimistic updates
 *   - Request deduplication
 * 
 * Common API Calls:
 * - Authentication (login, verify OTP)
 * - Order management (fetch, update status)
 * - Profile management (get, update)
 * - Service management (list, update)
 * - Vendor verification (submit documents)
 * 
 * B. Socket.io Integration
 * ------------------------
 * Location: src/apiService/socket/socket.ts
 * 
 * Purpose:
 * - Real-time order updates
 * - Live driver location tracking
 * - Instant notifications
 * - Order status changes
 * 
 * Socket Events (Common):
 * - 'order:new' - New order received
 * - 'order:update' - Order status changed
 * - 'location:update' - Driver location update
 * - 'driver:assigned' - Driver assigned to order
 * - 'delivery:status' - Delivery status update
 * 
 * Connection Management:
 * - Auto-connect on app launch
 * - Auto-reconnect on disconnect
 * - Authentication handshake
 * - Error handling and recovery
 * 
 * C. Data Flow Example (Order Update):
 * 
 * 1. User Action (e.g., Accept Order)
 *    ↓
 * 2. Component calls API function
 *    ↓
 * 3. Axios POST request with auth token
 *    ↓
 * 4. Server processes request
 *    ↓
 * 5. Server emits Socket.io event to all clients
 *    ↓
 * 6. Socket listener in app receives event
 *    ↓
 * 7. React Query cache invalidated
 *    ↓
 * 8. UI automatically re-renders with new data
 */

/**
 * ============================================================================
 * 7. STATE MANAGEMENT
 * ============================================================================
 * 
 * The app uses multiple state management approaches:
 * 
 * A. Zustand Stores (Global State)
 * --------------------------------
 * Location: src/apiService/store/
 * 
 * Available Stores:
 * 
 * 1. useAuthStore
 *    - User authentication state
 *    - Auth tokens
 *    - Navigation ref for auth flows
 *    - Login/logout methods
 * 
 * 2. useDialogStore
 *    - Global dialog/modal state
 *    - Dialog content management
 *    - Show/hide dialog methods
 * 
 * 3. Other stores (check store/ directory for complete list)
 * 
 * Example Usage:
 * ```typescript
 * import { useAuthStore } from '@/apiService/store/useAuthStore';
 * 
 * const { user, isAuthenticated, logout } = useAuthStore();
 * ```
 * 
 * B. React Query (Server State)
 * -----------------------------
 * Location: Configured in src/services/api/queryClient.ts
 * 
 * Used For:
 * - API data caching
 * - Background data synchronization
 * - Optimistic updates
 * - Loading/error states
 * 
 * Common Hooks:
 * - useQuery: Fetch data
 * - useMutation: Update data
 * - useQueryClient: Manual cache manipulation
 * 
 * C. Local Component State
 * ------------------------
 * - React useState for UI-only state
 * - Form inputs
 * - Modal visibility
 * - Loading indicators
 * 
 * D. AsyncStorage (Persistent Storage)
 * ------------------------------------
 * Used For:
 * - Auth tokens
 * - User preferences
 * - Offline data
 * - App settings
 */

/**
 * ============================================================================
 * 8. NAVIGATION STRUCTURE
 * ============================================================================
 * 
 * Navigation Library: React Navigation v7
 * 
 * A. Main Navigation Flow
 * -----------------------
 * File: src/navigation/AppNavigator.tsx
 * 
 * Stack Navigator (Root):
 * - Splash Screen
 * - Login (Auth Stack)
 * - Main App (Tab Navigator) - Requires authentication
 * - Order Details Screens
 * - Verification Screens
 * 
 * B. Bottom Tab Navigator
 * -----------------------
 * File: src/navigation/BottomTabNavigator.tsx
 * 
 * Tabs:
 * 1. Home - Dashboard & overview
 * 2. Orders - Order management
 * 3. Services - Service catalog
 * 4. Profile - Settings & profile
 * 
 * C. Authentication Flow
 * ----------------------
 * Unauthenticated:
 * Splash → Login → OTP Verification → Main App
 * 
 * Authenticated:
 * Splash → Main App (Tab Navigator)
 * 
 * D. Navigation Patterns
 * ----------------------
 * - Stack navigation for hierarchical flows
 * - Tab navigation for main sections
 * - Modal presentation for temporary content
 * - Deep linking support for notifications
 * 
 * E. Navigation Ref
 * -----------------
 * - Stored in useAuthStore for programmatic navigation
 * - Used for logout and session expiry redirects
 * - Enables navigation from non-component contexts
 */

/**
 * ============================================================================
 * 9. THIRD-PARTY INTEGRATIONS
 * ============================================================================
 * 
 * A. Google Maps
 * --------------
 * Purpose: Maps, geolocation, navigation
 * Implementation:
 * - API key stored in AndroidManifest.xml
 * - react-native-maps for map rendering
 * - Google Maps Directions API for routes
 * - Geocoding for address conversion
 * 
 * Key Files:
 * - src/screens/VendorVerification/map/ProfileLocation.tsx
 * - src/screens/Orders/ActiveOrderScreen (map navigation)
 * 
 * Features Used:
 * - Map display (standard, satellite views)
 * - Marker placement (custom SVG markers)
 * - Polyline routes
 * - Current location tracking
 * - Address autocomplete
 * 
 * B. Firebase
 * -----------
 * Purpose: Push notifications, analytics
 * Services:
 * - Firebase Cloud Messaging (FCM)
 * - Firebase Analytics (optional)
 * 
 * Configuration:
 * - google-services.json (Android)
 * - GoogleService-Info.plist (iOS)
 * 
 * Implementation:
 * - src/services/Notification/useNotifications.ts
 * - FCM token registration
 * - Notification handling (foreground/background)
 * 
 * C. Notifee
 * ----------
 * Purpose: Local notification UI customization
 * Features:
 * - Custom notification layouts
 * - Notification channels (Android)
 * - Badge count management
 * - Action buttons
 * 
 * D. Socket.io
 * ------------
 * Purpose: Real-time communication
 * Use Cases:
 * - Live order updates
 * - Driver location tracking
 * - Instant notifications
 * - Chat messaging (if implemented)
 * 
 * Configuration:
 * - Socket server URL in constants
 * - Auto-reconnection enabled
 * - Event listeners in relevant screens
 */

/**
 * ============================================================================
 * 10. BUILD & DEPLOYMENT
 * ============================================================================
 * 
 * A. Development Setup
 * --------------------
 * Prerequisites:
 * - Node.js >= 18
 * - React Native environment setup
 * - Android Studio (for Android)
 * - Xcode (for iOS, macOS only)
 * - Google Maps API key
 * - Firebase project setup
 * 
 * Installation Steps:
 * 1. Clone repository
 * 2. Run: npm install
 * 3. Install CocoaPods (iOS): 
 *    - bundle install
 *    - bundle exec pod install
 * 4. Configure environment variables
 * 5. Add Google Maps API key to AndroidManifest.xml
 * 6. Add google-services.json and GoogleService-Info.plist
 * 
 * B. Running the App
 * ------------------
 * Development Server:
 * npm start
 * 
 * Android:
 * npm run android
 * 
 * iOS:
 * npm run ios
 * 
 * C. Build Commands
 * -----------------
 * SVG Icon Generation:
 * npm run svg-icons
 * (Converts SVG files to React Native components)
 * 
 * Android Debug Build:
 * npm run build:debug
 * (Bundles JS and creates APK)
 * 
 * Individual Steps:
 * npm run bundle-android      # Bundle JavaScript
 * npm run assemble-android-debug  # Build APK
 * 
 * D. Build Outputs
 * ----------------
 * Android:
 * - Debug APK: android/app/build/outputs/apk/debug/app-debug.apk
 * - Release APK: android/app/build/outputs/apk/release/app-release.apk
 * 
 * iOS:
 * - Build from Xcode for release
 * - Archive for TestFlight/App Store
 * 
 * E. Environment Configuration
 * ----------------------------
 * Key Configuration Files:
 * - android/app/src/main/AndroidManifest.xml (Google Maps key)
 * - android/app/google-services.json (Firebase)
 * - ios/GoogleService-Info.plist (Firebase)
 * - src/constants/ (API URLs, app constants)
 * 
 * F. Release Checklist
 * --------------------
 * 1. Update version in package.json
 * 2. Update version code/name in build.gradle (Android)
 * 3. Update version in Info.plist (iOS)
 * 4. Build release bundles
 * 5. Test on physical devices
 * 6. Upload to Play Store/App Store
 * 7. Update release notes
 */

/**
 * ============================================================================
 * 11. DEVELOPMENT WORKFLOW
 * ============================================================================
 * 
 * A. Code Organization Best Practices
 * ------------------------------------
 * 1. Component Structure:
 *    - One component per file
 *    - Co-locate related files (styles, types)
 *    - Use functional components with hooks
 * 
 * 2. Naming Conventions:
 *    - PascalCase for components: UserProfile.tsx
 *    - camelCase for utilities: formatDate.ts
 *    - UPPER_CASE for constants: API_BASE_URL
 * 
 * 3. TypeScript Usage:
 *    - Define interfaces for all props
 *    - Use type inference where possible
 *    - Avoid 'any' type
 *    - Define types in types/ directory
 * 
 * 4. File Imports:
 *    - Use absolute imports (configured in tsconfig)
 *    - Group imports: React → Libraries → Local
 *    - Alphabetize within groups
 * 
 * B. Component Development
 * ------------------------
 * 1. Create reusable components in components/
 * 2. Screen-specific components in screens/<feature>/
 * 3. Use React.memo for performance optimization
 * 4. Implement proper error boundaries
 * 5. Add loading and error states
 * 
 * C. State Management Guidelines
 * -------------------------------
 * 1. Local state for UI-only concerns
 * 2. Zustand for global app state
 * 3. React Query for server state
 * 4. AsyncStorage for persistence
 * 
 * D. API Integration Pattern
 * --------------------------
 * 1. Define API functions in apiService/api/
 * 2. Use React Query hooks in components
 * 3. Handle loading/error states in UI
 * 4. Implement retry logic for failed requests
 * 5. Use optimistic updates for better UX
 * 
 * E. Testing Strategy
 * -------------------
 * - Unit tests: Jest for utilities and pure functions
 * - Component tests: React Test Renderer
 * - Integration tests: Test navigation flows
 * - E2E tests: Manual testing on devices
 * 
 * Run Tests:
 * npm test
 * 
 * F. Code Quality
 * ---------------
 * Linting:
 * npm run lint
 * 
 * Code Formatting:
 * - Prettier configured
 * - Auto-format on save (recommended)
 * 
 * G. Git Workflow
 * ---------------
 * Recommended Branch Strategy:
 * - main: Production-ready code
 * - develop: Development branch
 * - feature/*: Feature branches
 * - bugfix/*: Bug fixes
 * - hotfix/*: Production hotfixes
 * 
 * Commit Message Format:
 * - feat: New feature
 * - fix: Bug fix
 * - refactor: Code refactoring
 * - style: Formatting changes
 * - docs: Documentation updates
 * - test: Test updates
 */

/**
 * ============================================================================
 * 12. TROUBLESHOOTING & COMMON ISSUES
 * ============================================================================
 * 
 * A. Build Issues
 * ---------------
 * 
 * Issue: Metro bundler errors
 * Solution:
 * 1. Clear cache: npm start -- --reset-cache
 * 2. Delete node_modules and reinstall
 * 3. Clear watchman: watchman watch-del-all
 * 
 * Issue: Android build fails
 * Solution:
 * 1. Clean build: cd android && ./gradlew clean
 * 2. Check gradle.properties for correct settings
 * 3. Verify Android SDK installation
 * 
 * Issue: iOS build fails
 * Solution:
 * 1. Clean build folder in Xcode
 * 2. Delete Pods: cd ios && rm -rf Pods Podfile.lock
 * 3. Reinstall: bundle exec pod install
 * 4. Check Xcode version compatibility
 * 
 * B. Runtime Issues
 * -----------------
 * 
 * Issue: Map not displaying
 * Solution:
 * 1. Verify Google Maps API key in AndroidManifest.xml
 * 2. Enable Maps SDK in Google Cloud Console
 * 3. Check billing is enabled for Google Cloud project
 * 4. Verify device/emulator has Google Play Services
 * 
 * Issue: Push notifications not working
 * Solution:
 * 1. Check Firebase configuration files are present
 * 2. Verify FCM token is being generated
 * 3. Check notification permissions are granted
 * 4. Test on physical device (not emulator)
 * 5. Verify server is sending correct FCM format
 * 
 * Issue: Socket.io connection fails
 * Solution:
 * 1. Verify server URL and port
 * 2. Check network connectivity
 * 3. Verify CORS settings on server
 * 4. Check authentication token is valid
 * 5. Look for connection errors in logs
 * 
 * Issue: Images not loading
 * Solution:
 * 1. Verify image URLs are accessible
 * 2. Check network permissions
 * 3. Verify SSL certificates if using HTTPS
 * 4. Check image picker permissions
 * 
 * C. Performance Issues
 * ---------------------
 * 
 * Issue: App is slow/laggy
 * Solutions:
 * 1. Use React.memo for expensive components
 * 2. Implement FlatList instead of ScrollView for long lists
 * 3. Optimize images (compress, use appropriate sizes)
 * 4. Use Reanimated for complex animations
 * 5. Profile with React DevTools
 * 6. Check for memory leaks
 * 
 * Issue: Excessive re-renders
 * Solutions:
 * 1. Use useCallback for event handlers
 * 2. Use useMemo for expensive computations
 * 3. Check dependency arrays in hooks
 * 4. Avoid creating objects/arrays inline in JSX
 * 
 * D. Debugging Tools
 * ------------------
 * - React Native Debugger
 * - Flipper
 * - React DevTools
 * - Redux DevTools (for React Query)
 * - Console logs (console.log, console.warn)
 * - Network inspector
 * - Performance monitor (FPS, memory)
 * 
 * Enable Dev Menu:
 * - Android: Ctrl+M (Windows/Linux), Cmd+M (macOS)
 * - iOS: Cmd+D
 * 
 * E. Common Error Messages
 * ------------------------
 * 
 * "Unable to resolve module"
 * → Clear cache and restart Metro
 * 
 * "Network request failed"
 * → Check API URLs and network connectivity
 * 
 * "Unable to find maps"
 * → Verify Google Maps API key and SDK setup
 * 
 * "Firebase error"
 * → Check Firebase configuration files
 */

/**
 * ============================================================================
 * 13. RECENT UPDATES & CHANGES
 * ============================================================================
 * 
 * Based on recent development history:
 * 
 * A. Map Initial Location Fix (December 2025)
 * --------------------------------------------
 * Issue:
 * - Map in ProfileLocation screen wasn't showing current location initially
 * - User had to manually click "Use Current Location" button
 * 
 * Solution:
 * - Modified useEffect dependency array in ProfileLocation.tsx
 * - Added conditional check for zero coordinates
 * - Automatic getCurrentLocation() call on mount
 * - Map now centers on current location by default
 * 
 * Files Modified:
 * - src/screens/VendorVerification/map/ProfileLocation.tsx
 * 
 * B. Google Maps API Key Access (December 2025)
 * ----------------------------------------------
 * Issue:
 * - API key hardcoded in JavaScript files
 * - Need to access key from AndroidManifest.xml dynamically
 * 
 * Note:
 * - Google Maps key should be kept in native config
 * - Access via native modules or environment variables
 * - Avoid hardcoding sensitive keys in JavaScript
 * 
 * C. Invoice Download Implementation (December 2025)
 * ---------------------------------------------------
 * Feature:
 * - Added PDF invoice download from S3 URLs
 * - Implemented in CompletedOrderDetailsScreen
 * - Uses react-native-blob-util for file operations
 * - Saves invoices to device storage
 * 
 * Files:
 * - src/screens/Orders/CompletedOrderDetailsScreen
 * 
 * Implementation:
 * - downloadInvoice() function
 * - Fetches PDF from S3 URL
 * - Shows download progress
 * - Opens file after download
 * 
 * D. Map Navigation & Driver Tracking (December 2025)
 * ---------------------------------------------------
 * Features:
 * - Turn-by-turn navigation routes
 * - Real-time driver location tracking via Socket.io
 * - Custom SVG markers for vehicles
 * - Satellite/standard map view toggle
 * - Dynamic zoom level management
 * 
 * Files:
 * - src/screens/Orders/ActiveOrderScreen
 * 
 * Implementation:
 * - Socket listeners for location updates
 * - Google Directions API integration
 * - Custom marker components
 * - Conditional map rendering based on order status
 */

/**
 * ============================================================================
 * 14. FUTURE ENHANCEMENTS
 * ============================================================================
 * 
 * Potential Improvements & Features:
 * 
 * A. Technical Improvements
 * -------------------------
 * 1. Implement comprehensive error boundary system
 * 2. Add offline mode support with local database
 * 3. Implement code splitting for faster load times
 * 4. Add automated testing (unit, integration, E2E)
 * 5. Implement CI/CD pipeline
 * 6. Add performance monitoring (Sentry, Firebase Analytics)
 * 7. Implement feature flags for gradual rollouts
 * 8. Add accessibility features (VoiceOver/TalkBack support)
 * 9. Implement deep linking for better navigation
 * 10. Add biometric authentication
 * 
 * B. Feature Enhancements
 * -----------------------
 * 1. In-app chat with customers
 * 2. Voice navigation for drivers
 * 3. Multi-language support (i18n)
 * 4. Dark mode theme
 * 5. Advanced analytics dashboard
 * 6. Earnings and reporting module
 * 7. Schedule management
 * 8. Multi-vendor support (if applicable)
 * 9. Rating and review system
 * 10. Promotional campaigns management
 * 
 * C. UX Improvements
 * ------------------
 * 1. Skeleton loaders for better perceived performance
 * 2. Haptic feedback for interactions
 * 3. Micro-animations for state changes
 * 4. Better empty states
 * 5. Improved error messages
 * 6. Onboarding tutorial for new users
 * 7. Help and support section
 * 8. FAQ integration
 * 9. Quick actions/shortcuts
 * 10. Voice commands
 * 
 * D. Backend Integration
 * ----------------------
 * 1. GraphQL migration for efficient data fetching
 * 2. Webhook support for real-time events
 * 3. Improved caching strategy
 * 4. Optimistic updates for all mutations
 * 5. Better error handling and retry logic
 * 6. Request/response logging
 * 7. API versioning support
 * 8. Rate limiting handling
 */

/**
 * ============================================================================
 * QUICK REFERENCE COMMANDS
 * ============================================================================
 * 
 * // Development
 * npm start                        # Start Metro bundler
 * npm run android                  # Run on Android
 * npm run ios                      # Run on iOS
 * 
 * // Building
 * npm run svg-icons                # Generate SVG components
 * npm run build:debug              # Build Android debug APK
 * 
 * // Code Quality
 * npm run lint                     # Run ESLint
 * npm test                         # Run tests
 * 
 * // Android Specific
 * cd android && ./gradlew clean    # Clean Android build
 * cd android && ./gradlew assembleDebug  # Build debug APK
 * 
 * // iOS Specific
 * bundle install                   # Install Ruby dependencies
 * bundle exec pod install          # Install CocoaPods
 * 
 * // Troubleshooting
 * npm start -- --reset-cache       # Clear Metro cache
 * watchman watch-del-all           # Clear Watchman cache
 * rm -rf node_modules && npm install  # Reinstall dependencies
 */

/**
 * ============================================================================
 * IMPORTANT CONTACTS & RESOURCES
 * ============================================================================
 * 
 * Documentation:
 * - React Native: https://reactnative.dev/docs
 * - React Navigation: https://reactnavigation.org/docs
 * - React Query: https://tanstack.com/query/latest/docs
 * - Zustand: https://docs.pmnd.rs/zustand
 * - Socket.io: https://socket.io/docs/v4/
 * - Firebase: https://firebase.google.com/docs
 * - Google Maps: https://developers.google.com/maps
 * 
 * Community:
 * - React Native Community: https://github.com/react-native-community
 * - Stack Overflow: Tag [react-native]
 * 
 * Tools:
 * - React Native Debugger: https://github.com/jhen0409/react-native-debugger
 * - Flipper: https://fbflipper.com/
 */

/**
 * ============================================================================
 * NOTES FOR NEW DEVELOPERS
 * ============================================================================
 * 
 * 1. Start by familiarizing yourself with the project structure
 * 2. Review the navigation flow to understand app architecture
 * 3. Set up your development environment completely before coding
 * 4. Always test on both Android and iOS when making UI changes
 * 5. Follow the established code patterns and conventions
 * 6. Write self-documenting code and add comments for complex logic
 * 7. Test with real devices, not just emulators
 * 8. Keep dependencies up to date, but test thoroughly after updates
 * 9. Use TypeScript features for type safety
 * 10. Ask questions and document your learnings
 * 
 * Happy Coding! 🚀
 */

export { };
