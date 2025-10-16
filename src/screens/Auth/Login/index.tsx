import React, { useState } from 'react';
import {
  View,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import CustomBtn from '../../../components/CustomBtn';
import CustomText from '../../../components/Text';
import styles from './styles.ts';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../../apiService/api/authApi.ts';
import {
  ErrorResponse as LoginErrorResponse,
  LoginPayload,
  LoginResponse,
} from '../../../apiService/types/authTypes.ts';
import { AxiosError } from 'axios';
import { validateMobile } from '../../../utils/Validation.ts';
import { showErrorToast, showSuccessToast } from '../../../utils/Toast.ts';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  // const { mobile, setLocalMobile, handleSendOTP, isLoading } = useLogin();
  const navigation = useNavigation<LoginNavProp>();

  const [mobile, setLocalMobile] = useState('');

  const mutation = useMutation<
    LoginResponse,
    AxiosError<LoginErrorResponse>,
    LoginPayload
  >({
    mutationFn: payload => login(payload),
    onSuccess: data => {
      console.log('Login API response:', data.message);
      showSuccessToast(data?.message);
      navigation.navigate('OTPVerification', { mobile, isRegister: false });
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      console.log('Login API error:', msg);
      showErrorToast(msg);
    },
  });

  const handleLogin = () => {
    if (!validateMobile(mobile)) return;

    mutation.mutate({ phone: mobile }); // your API payload
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
            <CustomText style={styles.title}>Login</CustomText>
            <CustomText style={styles.subtitle}>
              Welcome back, you've been missed
            </CustomText>

            <View style={styles.inputRow}>
              <View style={styles.codeBox}>
                <CustomText style={styles.codeText}>+91</CustomText>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setLocalMobile}
                placeholderTextColor="#9AA0A6"
              />
            </View>

            <CustomBtn
              title={mutation.isPending ? 'Please wait...' : 'Login'}
              onPress={() => handleLogin()} // handleSendOTP}
              disabled={mutation.isPending}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: 20,
              }}
            >
              <CustomText style={styles.forgot}>
                Don't have an account?
              </CustomText>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Register')}
              >
                <CustomText style={styles.secondaryText}>Register</CustomText>
              </TouchableOpacity>
            </View>
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

export default LoginScreen;
