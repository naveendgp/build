import { Alert } from 'react-native';


export const isValidateOTP = (otp: string): boolean => {
  if (!/^\d{4}$/.test(otp)) {
    Alert.alert('Invalid number', 'Please enter a valid 4-digit otp');
    return false;
  }
  return true;
};
