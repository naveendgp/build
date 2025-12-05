// src/navigation/AppNavigator.tsx
import React, { forwardRef } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/Login';
import OTPVerificationScreen from '../screens/Auth/OTPVerification';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import VendorVerificationScreen from '../screens/VendorVerification';
import ReviewDetailsScreen from '../screens/VendorVerification/ReviewDetails';
import MapScreen from '../screens/VendorVerification/map/MapScreen';
import ProfileLocation from '../screens/VendorVerification/map/ProfileLocation';
import BottomTabNavigator from './BottomTabNavigator';
import ShopReviewsScreen from '../screens/Profile/SubScreens/ShopReviewsScreen';
import ServicesScreen from '../screens/Services';
import ActiveServicesPricingScreen from '../screens/Services/ActiveServicesPricing';
import CategoryListScreen from '../screens/Services/CategoryList';
import ServiceDetailScreen from '../screens/Services/ServiceDetail';
import OrderDetailsScreen from '../screens/Orders/OrderDetails';
import { Service } from '../apiService/types/profileTypes';
import ProfileDetailsScreen from '../screens/VendorVerification/ProfileDetails';
import ShopDetailsScreen from '../screens/VendorVerification/ShopDetails';
import BankDetailsScreen from '../screens/VendorVerification/BankDetails';
import SplashScreen from '../screens/SplashScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { mobile: string; isRegister?: boolean };
  VendorVerification: { step?: number; isReupload?: boolean } | undefined;
  ReviewDetails: undefined;
  MainTabs: undefined;
  Orders: undefined;
  Profile: undefined;
  ServicesPricing: undefined;
  Services: undefined;
  CategoryListScreen: { service: any; category?: string };
  ServiceDetail: { service: Service };
  OrderConfirmation: undefined;
  OrdersDrawerScreen: undefined;
  OrderDetails: { orderId: string } | undefined;
  UserProfile: undefined;
  MapScreen: undefined;
  ProfileLocation: { onSelect?: (data: { address: string; latitude: number; longitude: number }) => void } | undefined;
  ProfileDetails: { readOnly?: boolean } | undefined;
  ShopDetails: { readOnly?: boolean } | undefined;
  BankDetails: { readOnly?: boolean } | undefined;
  ActiveServicesPricingScreen: undefined;
  ShopReviewsScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = forwardRef<NavigationContainerRef<any>>((props, ref) => {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={ref}>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
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
            name="OTPVerification"
            component={OTPVerificationScreen}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name="VendorVerification"
            component={VendorVerificationScreen}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name="ReviewDetails"
            component={ReviewDetailsScreen}
          />

          <Stack.Screen
            name="MapScreen"
            component={MapScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileLocation"
            component={ProfileLocation}
            options={{ headerShown: false }}
          />

          {/* Profile Sub-screens */}





          <Stack.Screen
            name="Services"
            component={ServicesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ActiveServicesPricingScreen"
            component={ActiveServicesPricingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CategoryListScreen"
            component={CategoryListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ServiceDetail"
            component={ServiceDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ProfileDetails"
            component={ProfileDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ShopDetails"
            component={ShopDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BankDetails"
            component={BankDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ShopReviewsScreen"
            component={ShopReviewsScreen}
            options={{ headerShown: false }}
          />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
});

export default AppNavigator;
