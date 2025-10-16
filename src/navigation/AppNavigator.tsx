// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: { mobile: string; isRegister?: boolean };
  VendorVerification: undefined;
  Home: undefined;
  OrderConfirmation: undefined;
  OrdersDrawerScreen: undefined;
  OrderDetails: { order: any } | undefined;
  UserProfile: undefined;
  FilePicker: undefined;
  MapScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
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
        return 'Home';
      
      case LoginUserStatus.DOC_PENDING_UPLOAD:
      case LoginUserStatus.DOC_REUPLOAD_REQUIRED:
        return 'VendorVerification';
      
      case LoginUserStatus.INACTIVE:
      case LoginUserStatus.BLOCKED:
      default:
        return 'Login';
    }
  };

  console.log('AppNavigator - isLoggedIn:', isLoggedIn, 'documentState:', documentState);
  
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={getInitialRoute()}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;
