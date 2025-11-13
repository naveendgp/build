// src/navigation/AppNavigator.tsx
import React, { forwardRef } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/Login';
import RegisterScreen from '../screens/Auth/Register';
import OTPVerificationScreen from '../screens/Auth/OTPVerification';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FilePickerScreen from '../utils/FilePicker';
import VendorVerificationScreen from '../screens/VendorVerification';
import HomeScreen from '../screens/Home';
import { useAuthStore } from '../apiService/store/useAuthStore';
import MapScreen from '../screens/VendorVerification/map/MapScreen';
import { LoginUserStatus } from '../constants/tripStatus';
import BottomTabNavigator from './BottomTabNavigator';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import BusinessSettingsScreen from '../screens/Profile/BusinessSettingsScreen';
import ServicesPricingScreen from '../screens/Profile/ServicesPricingScreen';
import ShopStatusScreen from '../screens/Profile/ShopStatusScreen';
import WalletScreen from '../screens/Profile/WalletScreen';
import ServicesScreen from '../screens/Services';
import ShopListScreen from '../screens/ShopList';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: { mobile: string; isRegister?: boolean };
  VendorVerification: undefined;
  MainTabs: undefined;
  Orders: undefined;
  Profile: undefined;
  EditProfile: undefined;
  BusinessSettings: undefined;
  ServicesPricing: undefined;
  ShopStatus: undefined;
  Wallet: undefined;
  Services: undefined;
  ShopList: { service: any };
  OrderConfirmation: undefined;
  OrdersDrawerScreen: undefined;
  OrderDetails: { order: any } | undefined;
  UserProfile: undefined;
  FilePicker: undefined;
  MapScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = forwardRef<NavigationContainerRef<any>>((props, ref) => {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const documentState = useAuthStore(state => state.documentState);

  // Determine initial route based on login status and document state
  const getInitialRoute = () => {
    if (!isLoggedIn) {
      return 'Login';
    }

    // If logged in, check document state
    switch (documentState) {
      case LoginUserStatus.ACTIVE:
      case LoginUserStatus.DOC_UNDER_REVIEW:
        return 'MainTabs';

      case LoginUserStatus.DOC_PENDING_UPLOAD:
      case LoginUserStatus.DOC_REUPLOAD_REQUIRED:
        return 'VendorVerification';

      case LoginUserStatus.INACTIVE:
      case LoginUserStatus.BLOCKED:
      default:
        return 'Login';
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={ref}>
        <Stack.Navigator initialRouteName={getInitialRoute()}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MainTabs"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name="Register"
            component={RegisterScreen}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name="OTPVerification"
            component={OTPVerificationScreen}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name="VendorVerification"
            component={VendorVerificationScreen}
          />
          <Stack.Screen
            name="FilePicker"
            component={FilePickerScreen}
            options={{ title: 'Pick a File' }}
          />
          <Stack.Screen
            name="MapScreen"
            component={MapScreen}
            options={{ headerShown: false }}
          />

          {/* Profile Sub-screens */}
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BusinessSettings"
            component={BusinessSettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ServicesPricing"
            component={ServicesPricingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ShopStatus"
            component={ShopStatusScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Services"
            component={ServicesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ShopList"
            component={ShopListScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
});

export default AppNavigator;
