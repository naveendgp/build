import React from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import styles from './styles';
import { useRoute } from '@react-navigation/native';
import CustomBtn from '../../../components/CustomBtn';
import CustomText from '../../../components/Text';
import { isValidateOTP } from '../../../utils/Validation';
import { useOtpInput } from './hooks/useOtpInput';
import { useOtpVerification } from './hooks/useOtpVerification';

const OTPVerificationScreen: React.FC = () => {
  const route = useRoute<any>();
  const { mobile, isRegister } = route.params;

  const { digits, otp, handleChange, handleKeyPress, inputsRef } =
    useOtpInput(4);
  const mutation = useOtpVerification(mobile, isRegister);

  const handleVerifyOtp = () => {
    if (!isValidateOTP(otp)) return;
    mutation.mutate(otp);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../../assets/background/bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.wrapper}>
          <View style={styles.card}>
            <CustomText style={styles.title}>Verify OTP</CustomText>
            <CustomText style={styles.subtitle}>
              Enter the 4-digit code sent to {mobile}
            </CustomText>

            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={ref => (inputsRef.current[i] = ref)}
                  style={styles.otpBox}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={d}
                  onChangeText={val => handleChange(i, val)}
                  onKeyPress={e => handleKeyPress(i, e)}
                  textAlign="center"
                  placeholder="-"
                />
              ))}
            </View>

            <CustomBtn
              title={mutation.isPending ? 'Verifying...' : 'Verify'}
              onPress={handleVerifyOtp}
              disabled={mutation.isPending}
            />

            <CustomText style={styles.or}>Didn't receive? Resend</CustomText>
          </View>
        </View>
      </ImageBackground>

      {mutation.isPending && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default OTPVerificationScreen;
