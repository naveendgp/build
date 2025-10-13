import { useState, useRef, useEffect } from 'react';
import { TextInput, Alert } from 'react-native';
import { useAuthStore } from '../../../../store/useAuthStore';
import CustomToast from '../../../../components/CustomToast';
import { COLORS } from '../../../../constants';

export const useOTPVerification = () => {
  const verifyOtp = useAuthStore(state => state.verifyOtp);
  const verifyOtpLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const token = useAuthStore(state => state.token);
  const mobile = useAuthStore(state => state.signupData?.phone);
  const successMsg = useAuthStore(state => state.signupData?.successMsg);

  // 🔹 Local state for OTP digits
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const inputsRef = useRef<Array<TextInput | null>>([]);

  // -------------------------------
  // 🔹 OTP Input Handlers
  // -------------------------------
  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    if (value && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      digits[index] === '' &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const otpValue = digits.join('');

  // -------------------------------
  // 🔹 Verify OTP
  // -------------------------------
  const handleVerifyOTP = async () => {
    if (!/^\d{4}$/.test(otpValue)) {
      Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP');
      return;
    }

    try {
      await verifyOtp(mobile ?? '', otpValue);
    } catch (err) {
      console.error('Error verifying OTP:', err);
    }
  };

  // -------------------------------
  // 🔹 Side Effects
  // -------------------------------
  useEffect(() => {
    if (token) {
      CustomToast.show({
        msg: successMsg?.toString() ?? 'OTP Verified Successfully',
        bgColor: COLORS.SUCCESS,
        textColor: COLORS.WHITE,
      });
      console.log('✅ OTP Verified! Token:', token);
    }
  }, [token]);

  useEffect(() => {
    if (error) {
      CustomToast.show({
        msg: error.toString(),
        bgColor: COLORS.ERROR,
        textColor: COLORS.WHITE,
      });
    }
  }, [error]);

  return {
    digits,
    inputsRef,
    handleChange,
    handleKeyPress,
    handleVerifyOTP,
    verifyOtpLoading,
    mobile,
  };
};
