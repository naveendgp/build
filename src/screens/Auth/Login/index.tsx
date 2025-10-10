import React, { useState, useEffect } from 'react';
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
import { useUserStore } from '../../../store/useStore';
import CustomBtn from '../../../components/CustomBtn';
import CustomText from '../../../components/Text';
import styles from './styles.ts';
import { useAuthStore } from '../../../store/useAuthStore.ts';
import { shallow } from 'zustand/shallow';
import CustomToast from '../../../components/CustomToast.tsx';
import { COLORS } from '../../../constants/colors.ts';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();

  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const signupData = useAuthStore(state => state.signupData);
  const clearError = useAuthStore(state => state.clearError);

  const setMobile = useUserStore(state => state.setMobile);
  const [mobile, setLocalMobile] = useState('');
  const [hasNavigated, setHasNavigated] = useState(false);

  // Show alert for API errors
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error]);

  // // Navigate to OTP screen only once after successful login/signup
  useEffect(() => {
    if (signupData && !hasNavigated) {
      const digitsOnly = signupData.phone.replace(/\D/g, '');
      setMobile(digitsOnly);
      navigation.navigate('OTPVerification', {
        mobile: digitsOnly,
        isRegister: signupData.isNewUser,
      });
      setHasNavigated(true); // Prevent repeated navigation
    }
  }, [signupData, hasNavigated]);

  const handleSendOTP = async () => {
    const digitsOnly = mobile.replace(/\D/g, '');
    if (!/^\d{10}$/.test(digitsOnly)) {
      CustomToast.show({
        msg: 'Please enter a valid 10-digit mobile number',
        bgColor: COLORS.ERROR,
        textColor: COLORS.WHITE,
      });
      return;
    }

    console.log('Sending OTP to', digitsOnly);

    try {
      await login('+919844556677');
    } catch (err) {
      console.error('Login error:', err);
      CustomToast.show({
        msg: 'Failed to send OTP. Please try again.',
        bgColor: COLORS.ERROR,
        textColor: COLORS.WHITE,
      });
    }
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
              title={isLoading ? 'Please wait...' : 'Login'}
              onPress={handleSendOTP}
              disabled={isLoading}
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

      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default LoginScreen;
