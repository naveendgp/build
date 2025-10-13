import React from 'react';
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
import { useLogin } from './hooks/useLogin.ts';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const { mobile, setLocalMobile, handleSendOTP, isLoading } = useLogin();
  const navigation = useNavigation<LoginNavProp>();

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
