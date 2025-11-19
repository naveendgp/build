// hooks/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { login } from '../../../../apiService/api/authApi';
import { showErrorToast, showSuccessToast } from '../../../../utils/Toast';
import {
  ErrorResponse as LoginErrorResponse,
  LoginPayload,
  LoginResponse,
} from '../../../../apiService/types/authTypes';
import { AxiosError } from 'axios';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const useLogin = () => {
  const navigation = useNavigation<LoginNavProp>();

  const mutation = useMutation<
    LoginResponse,
    AxiosError<LoginErrorResponse>,
    LoginPayload
  >({
    mutationFn: payload => login(payload),
    onSuccess: (data, variables) => {
      if (data?.status) {
        showSuccessToast(data?.message || 'OTP sent successfully');
        navigation.navigate('OTPVerification', {
          mobile: variables.phone,
          isRegister: false,
        });
      } else {
        showErrorToast(data?.message || 'Failed to send OTP');
         navigation.navigate('OTPVerification', {
          mobile: variables.phone,
          isRegister: false,
        });
      }
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      showErrorToast(msg || 'Failed to send OTP');
    },
  });

  return mutation;
};

