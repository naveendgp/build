// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/Login';
import RegisterScreen from '../screens/Auth/Register';
import OTPVerificationScreen from '../screens/Auth/OTPVerification';
import { useUserStore } from '../store/useStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FilePickerScreen from '../utils/FilePicker';

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const isLoggedIn = useUserStore(state => state.isLoggedIn);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {isLoggedIn ? (
            <>
              <Stack.Screen
                name="Home"
                component={require('../screens/Home').default}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
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
                component={require('../screens/VendorVerification').default}
              />
              <Stack.Screen
                name="FilePicker"
                component={FilePickerScreen}
                options={{ title: 'Pick a File' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;
