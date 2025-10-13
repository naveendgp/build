import { useState, useEffect } from 'react';
import { useUserStore } from '../../../../store/useStore';
import LoginNavProp, {
  RootStackParamList,
} from '../../../../navigation/AppNavigator';
import CustomToast from '../../../../components/CustomToast';
import { COLORS } from '../../../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../../store/useAuthStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const useLogin = () => {
  const navigation = useNavigation<LoginNavProp>();
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const signupData = useAuthStore(state => state.signupData);
  const clearError = useAuthStore(state => state.clearError);
  const setMobile = useUserStore(state => state.setMobile);

  const [mobile, setLocalMobile] = useState('');

  // Show toast on error
  useEffect(() => {
    if (error) {
      CustomToast.show({
        msg: error.toString(),
        bgColor: COLORS.ERROR,
        textColor: COLORS.WHITE,
      });
      clearError();
    }
  }, [error]);

  // Navigate to OTP after signup/login
  useEffect(() => {
    if (signupData) {
      const digitsOnly = signupData.phone?.replace(/\D/g, '') ?? '';
      setMobile(digitsOnly);
      navigation.navigate('OTPVerification', {
        mobile: digitsOnly,
        isRegister: false,
      });
    }
  }, [signupData]);

  const handleSendOTP = async () => {
    const digitsOnly = mobile.replace(/\D/g, '');
    if (!/^\d{10}$/.test(digitsOnly)) {
      CustomToast.show({
        msg: 'Please enter a valid 10-digit mobile number',
        bgColor: COLORS.ERROR,
        textColor: COLORS.WHITE,
      });
      return;
    }

    try {
      await login(digitsOnly);
    } catch (err) {
      console.error('Login error:', err);
      CustomToast.show({
        msg: 'Failed to send OTP. Please try again.',
        bgColor: COLORS.ERROR,
        textColor: COLORS.WHITE,
      });
    }
  };

  return { mobile, setLocalMobile, handleSendOTP, isLoading };
};
