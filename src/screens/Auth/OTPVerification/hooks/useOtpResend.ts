// hooks/useOtpResend.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { resendOtp } from '../../../../apiService/api/authApi';
import { showErrorToast, showSuccessToast } from '../../../../utils/Toast';
import {
  ReSendOtpPayload,
  ReSendOtpResponse,
  ErrorResponse as LoginErrorResponse,
} from '../../../../apiService/types/authTypes';
import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';

const TIMER_DURATION = 30; // seconds

export const useOtpResend = (mobile: string) => {
  const [timer, setTimer] = useState<number>(TIMER_DURATION);
  const [isResendEnabled, setIsResendEnabled] = useState<boolean>(false);

  // refs to hold latest values accessible from callbacks/listeners that don't re-create
  const timerRef = useRef<number>(timer);
  const backgroundTimeRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // keep timerRef in sync with state
  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  // Mutation for resending OTP
  const resendMutation = useMutation<
    ReSendOtpResponse,
    AxiosError<LoginErrorResponse>,
    ReSendOtpPayload
  >({
    mutationFn: payload => resendOtp(payload),
    onSuccess: data => {
      if (data?.status) {
        showSuccessToast(data?.message || 'OTP resent successfully');

        // reset timer and disable resend
        setTimer(TIMER_DURATION);
        timerRef.current = TIMER_DURATION;
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

  // AppState listener: run once, use refs to read/write latest values
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const prevAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      // App -> Background: store timestamp
      if (prevAppState === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTimeRef.current = Date.now();
      }

      // Background -> Foreground: compute elapsed and adjust timer
      else if (prevAppState.match(/inactive|background/) && nextAppState === 'active') {
        if (backgroundTimeRef.current !== null && timerRef.current > 0) {
          const elapsedSeconds = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);

          setTimer(prev => {
            const newTimer = Math.max(0, prev - elapsedSeconds);
            timerRef.current = newTimer; // keep ref synced
            if (newTimer <= 0) {
              setIsResendEnabled(true);
              return 0;
            }
            return newTimer;
          });
        }
        backgroundTimeRef.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, []); // run once

  // Single interval that decrements timerRef/state every second
  useEffect(() => {
    const interval = setInterval(() => {
      // only decrement when there's remaining time
      if (timerRef.current > 0) {
        setTimer(prev => {
          const next = prev - 1;
          const newTimer = Math.max(0, next);
          timerRef.current = newTimer;
          if (newTimer <= 0) {
            setIsResendEnabled(true);
            return 0;
          }
          return newTimer;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []); // run once

  // handler to trigger resend
  const handleResend = useCallback(() => {
    if (!isResendEnabled || resendMutation.isPending) return;
    resendMutation.mutate({ phone: mobile });
  }, [isResendEnabled, mobile, resendMutation]);

  return {
    timer,
    isResendEnabled,
    handleResend,
    isResending: resendMutation.isPending,
  };
};
