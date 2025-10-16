// hooks/useOtpVerification.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../../apiService/store/useAuthStore';
import { verifyOtp } from '../../../../apiService/api/authApi';
import { showErrorToast, showSuccessToast } from '../../../../utils/Toast';
import { LoginUserStatus } from '../../../../constants/tripStatus';
import {
  ErrorResponse,
  OtpPayload,
  OtpResponse,
} from '../../../../apiService/types/types';
import { AxiosError } from 'axios';

export const useOtpVerification = (mobile: string, isRegister: boolean) => {
  const navigation = useNavigation<any>();
  const setToken = useAuthStore(state => state.setToken);
  const setLoggedIn = useAuthStore(state => state.setIsLoggedIn);
  const fcm = useAuthStore(state => state.fcmToken);

  const mutation = useMutation<
    OtpResponse,
    AxiosError<ErrorResponse>,
    string // ✅ otp string only
  >({
    mutationFn: (otp: string) =>
      verifyOtp({ phone: mobile, otp, fcm_token: fcm }),
    onSuccess: data => {
      setToken(data.data.token);
      setLoggedIn(true);
      showSuccessToast(data?.message);

      if (isRegister) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'VendorVerification' }],
        });
        return;
      }

      switch (data?.data.status) {
        case LoginUserStatus.ACTIVE:
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          break;

        case LoginUserStatus.BLOCKED:
        case LoginUserStatus.INACTIVE:
          showErrorToast('Login Denied, your account is inactive or blocked.');
          break;

        case LoginUserStatus.DOC_PENDING_UPLOAD:
        case LoginUserStatus.DOC_REUPLOAD_REQUIRED:
          navigation.reset({
            index: 0,
            routes: [{ name: 'VendorVerification' }],
          });
          break;

        case LoginUserStatus.DOC_UNDER_REVIEW:
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          break;
      }
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      showErrorToast(msg);
    },
  });

  return mutation;
};
