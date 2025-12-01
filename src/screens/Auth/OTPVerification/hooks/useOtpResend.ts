// hooks/useOtpResend.ts
import { useState, useEffect, useCallback } from 'react';
import { resendOtp } from '../../../../apiService/api/authApi';
import { showErrorToast, showSuccessToast } from '../../../../utils/Toast';
import { ReSendOtpPayload, ReSendOtpResponse, ErrorResponse as LoginErrorResponse } from '../../../../apiService/types/authTypes';
import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';

const TIMER_DURATION = 60; // 60 seconds

export const useOtpResend = (mobile: string) => {
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  const resendMutation = useMutation<
    ReSendOtpResponse,
    AxiosError<LoginErrorResponse>,
    ReSendOtpPayload
  >({
    mutationFn: payload => resendOtp(payload),
    onSuccess: data => {
      if (data?.status) {
        showSuccessToast(data?.message || 'OTP resent successfully');
        setTimer(TIMER_DURATION);
        setIsResendEnabled(false);
      } else {
        showErrorToast(data?.message || 'Failed to resend OTP');
      }
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      showErrorToast(msg || 'Failed to resend OTP');
    },
  });

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setIsResendEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleResend = useCallback(() => {
    if (isResendEnabled && !resendMutation.isPending) {
      resendMutation.mutate({ phone: mobile });
    }
  }, [isResendEnabled, mobile, resendMutation]);

  return {
    timer,
    isResendEnabled,
    handleResend,
    isResending: resendMutation.isPending,
  };
};

