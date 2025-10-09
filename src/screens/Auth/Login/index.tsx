import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Alert,
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
import { useAuthApi } from '../../../api/authApi.ts';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const setMobile = useUserStore(state => state.setMobile);
  const { login, data, loading: authApiLoading, error, status } = useAuthApi();
  const [mobile, setLocalMobile] = useState('');

  const handleSendOTP = async () => {
    const digitsOnly = mobile.replace(/\D/g, '');

    // Validate 10-digit mobile number
    if (!/^\d{10}$/.test(digitsOnly)) {
      Alert.alert(
        'Invalid number',
        'Please enter a valid 10-digit mobile number',
      );
      return;
    }

    try {
      // Call login API with sanitized number
      await login('+91' + digitsOnly);
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  useEffect(() => {
    if (status === true) {
      const digitsOnly = mobile.replace(/\D/g, '');
      setMobile(digitsOnly);
      navigation.navigate('OTPVerification', {
        mobile: digitsOnly,
        isRegister: false,
      });
    } else if (status === false) {
      Alert.alert('Error', error?.toString());
    }
  }, [status, error]);

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
              Welcome back you're been missed
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
              title={authApiLoading ? 'Please wait...' : 'Login'}
              onPress={handleSendOTP}
              disabled={authApiLoading}
            />

            <View
              style={{
                alignItems: 'center',
                alignContent: 'center',
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
      {authApiLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default LoginScreen;
