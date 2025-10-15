import { Alert } from 'react-native';

export const validateMobile = (mobile: string): boolean => {
  if (!/^\d{10}$/.test(mobile)) {
    Alert.alert(
      'Invalid number',
      'Please enter a valid 10-digit mobile number',
    );
    return false;
  }
  return true;
};

export const isValidateOTP = (otp: string): boolean => {
  if (!/^\d{4}$/.test(otp)) {
    Alert.alert('Invalid number', 'Please enter a valid 4-digit otp');
    return false;
  }
  return true;
};
