import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/Login';
import OTPVerificationScreen from '../screens/Auth/OTPVerification';

export type AuthStackParamList = {
  Login: undefined;
  OTPVerify: { mobile: string; isRegister?: boolean };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerificationScreen} />
    </Stack.Navigator>
  );
};