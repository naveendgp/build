import React, { useRef, useState } from 'react';
import {
  View,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import CustomBtn from '../../../components/CustomBtn';
import styles from './styles.ts';
import CustomText from '../../../components/Text';
import { useMutation } from '@tanstack/react-query';
import {
  ErrorResponse,
  OtpPayload,
  OtpResponse,
} from '../../../apiService/types/types.ts';
import { AxiosError } from 'axios';
import { verifyOtp } from '../../../apiService/api/authApi.ts';
import { useAuthStore } from '../../../apiService/store/useAuthStore.ts';
import { isValidateOTP } from '../../../utils/Validation.ts';
import { showErrorToast, showSuccessToast } from '../../../utils/Toast.ts';

type OTPNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'OTPVerification'
>;
type OTPRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPNavProp>();
  const route = useRoute<OTPRouteProp>();
  const { mobile, isRegister } = route.params;
  const setToken = useAuthStore(state => state.setToken);
  const setLoggedIn = useAuthStore(state => state.setIsLoggedIn);
  const fcm = useAuthStore(state => state.fcmToken);

  console.log('Mobile number:', mobile);

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const inputsRef = useRef<Array<TextInput | null>>([]);
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

  const handleVerifyOtp = () => {
    if (!isValidateOTP(digits.join(''))) return;

    mutation.mutate({
      phone: mobile,
      otp: digits.join(''),
      fcm_token: fcm,
    });
  };

  const mutation = useMutation<
    OtpResponse,
    AxiosError<ErrorResponse>,
    OtpPayload
  >({
    mutationFn: payload => verifyOtp(payload),
    onSuccess: data => {
      console.log('Login API response:', data.data.token);
      setToken(data.data.token);
      setLoggedIn(true);
      showSuccessToast(data?.message);
      if (isRegister) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'VendorVerification' }],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      showErrorToast(msg);
      console.log('Login API error:', msg);
    },
  });

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
              title={mutation.isPending ? 'Verifying...' : 'Verify'}
              onPress={() => handleVerifyOtp()}
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
