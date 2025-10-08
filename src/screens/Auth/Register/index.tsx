import React, { useState } from 'react';
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

type RegisterNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavProp>();
  const setMobile = useUserStore(state => state.setMobile);
  const [mobile, setLocalMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = () => {
    const digitsOnly = mobile.replace(/\D/g, '');
    if (!/^\d{10}$/.test(digitsOnly)) {
      Alert.alert(
        'Invalid number',
        'Please enter a valid 10-digit mobile number',
      );
      return;
    }
    setLoading(true);
    setMobile(digitsOnly);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OTPVerification', {
        mobile: digitsOnly,
        isRegister: true,
      });
    }, 500);
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
            <CustomText style={styles.title}>Create account</CustomText>
            <CustomText style={styles.subtitle}>
              Join us — enter your mobile number to get started
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

            {/* Name and proof upload removed - only mobile is required for registration */}

            <CustomBtn
              title={loading ? 'Please wait...' : 'Register'}
              onPress={handleSendOTP}
              disabled={loading}
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
                Already have an account?
              </CustomText>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <CustomText style={styles.secondaryText}>Sign in</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default RegisterScreen;
