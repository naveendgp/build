import React from 'react';
import {
  View,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import CustomBtn from '../../../components/CustomBtn';
import styles from './styles.ts';
import CustomText from '../../../components/Text';
import { useOTPVerification } from './hook/useOTPVerification.ts';

type OTPNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'OTPVerification'
>;
type OTPRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC = () => {
  const {
    digits,
    inputsRef,
    handleChange,
    handleKeyPress,
    handleVerifyOTP,
    verifyOtpLoading,
    mobile,
  } = useOTPVerification();

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
                  importantForAutofill="no"
                  placeholder="-"
                />
              ))}
            </View>

            <CustomBtn
              title={verifyOtpLoading ? 'Verifying...' : 'Verify'}
              onPress={handleVerifyOTP}
              disabled={verifyOtpLoading}
            />

            <CustomText style={styles.or}>Didn't receive? Resend</CustomText>
          </View>
        </View>
      </ImageBackground>

      {verifyOtpLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default OTPVerificationScreen;
