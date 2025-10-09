import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useUserStore } from '../../../store/useStore';
import CustomBtn from '../../../components/CustomBtn';
import styles from './styles.ts';
import CustomText from '../../../components/Text';
import { useAuthApi } from '../../../api/authApi.ts';
import { useAuthStore } from '../../../store/useAuthStore.ts';

type OTPNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'OTPVerification'
>;
type OTPRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPNavProp>();
  const route = useRoute<OTPRouteProp>();
  const { mobile, isRegister } = route.params;

  // 🔹 API Hook
  const {
    verifyOtp,
    data,
    loading: verifyOtpLoading,
    error,
    status,
  } = useAuthApi();

  // 🔹 Local States
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<Array<TextInput | null>>(
    [] as Array<TextInput | null>,
  );

  // 🔹 Auth Store for persistent login
  const setLogin = useAuthStore(state => state.setLogin);

  // -------------------------------
  // 🔹 Handle OTP Input
  // -------------------------------
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

  const otpValue = digits.join('');

  // -------------------------------
  // 🔹 Verify OTP API Call
  // -------------------------------
  const handleVerifyOTP = async () => {
    if (!/^\d{6}$/.test(otpValue)) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    await verifyOtp(mobile, otpValue);
  };

  // -------------------------------
  // 🔹 Handle API Response (auto navigate)
  // -------------------------------
  useEffect(() => {
    if (verifyOtpLoading) return;

    if (status === true && data) {
      // ✅ OTP verified successfully
      const token = data?.data?.token || data?.token; // adjust per API shape

      if (token) {
        // ✅ Store in AsyncStorage via Zustand
        setLogin(token);
      }

      Alert.alert('Success', 'OTP verified successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (isRegister) {
              navigation.navigate('VendorVerification');
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
          },
        },
      ]);
    } else if (status === false && error) {
      // ❌ API returned an error
      Alert.alert('Verification Failed', error.toString());
    }
  }, [status, data, error, verifyOtpLoading]);

  // -------------------------------
  // 🔹 UI
  // -------------------------------
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
              Enter the 6-digit code sent to {mobile}
            </CustomText>

            {/* 🔹 OTP Input Boxes */}
            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={ref => {
                    inputsRef.current[i] = ref;
                  }}
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

            {/* 🔹 Verify Button */}
            <CustomBtn
              title={verifyOtpLoading ? 'Verifying...' : 'Verify'}
              onPress={handleVerifyOTP}
              disabled={verifyOtpLoading}
            />

            <CustomText style={styles.or}>Didn't receive? Resend</CustomText>
          </View>
        </View>
      </ImageBackground>

      {/* 🔹 Loading Overlay */}
      {verifyOtpLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
};
// const OTPVerificationScreen: React.FC = () => {
//   const navigation = useNavigation<OTPNavProp>();
//   const route = useRoute<OTPRouteProp>();
//   const { mobile, isRegister } = route.params;
//   const {
//     verifyOtp,
//     data,
//     loading: verifyOtpLoading,
//     error,
//     status,
//   } = useAuthApi();

//   const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
//   const [loading, setLoading] = useState(false);

//   const inputsRef = useRef<Array<TextInput | null>>(
//     [] as Array<TextInput | null>,
//   );

//   const setLoggedIn = useUserStore(state => state.setLoggedIn);
//   const setUsernameStore = useUserStore(state => state.setUsername);

//   const handleChange = (index: number, value: string) => {
//     if (!/^[0-9]*$/.test(value)) return;
//     const next = [...digits];
//     next[index] = value.slice(-1);
//     setDigits(next);

//     if (value && index < inputsRef.current.length - 1) {
//       inputsRef.current[index + 1]?.focus();
//     }
//   };

//   const handleKeyPress = (index: number, e: any) => {
//     if (
//       e.nativeEvent.key === 'Backspace' &&
//       digits[index] === '' &&
//       index > 0
//     ) {
//       inputsRef.current[index - 1]?.focus();
//     }
//   };

//   const otpValue = digits.join('');

//   const handleVerifyOTP = () => {
//     if (!/^\d{6}$/.test(otpValue)) {
//       Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
//       return;
//     }
//     setLoading(true);
//     setTimeout(() => {
//       setLoading(false);
//       if (isRegister) {
//         navigation.navigate('VendorVerification');
//       } else {
//         setLoggedIn(true);
//         navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
//       }
//     }, 800);
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ImageBackground
//         source={require('../../../assets/background/bg.png')}
//         style={styles.background}
//         resizeMode="cover"
//       >
//         <View style={styles.wrapper}>
//           <View style={styles.card}>
//             <CustomText style={styles.title}>Verify OTP</CustomText>
//             <CustomText style={styles.subtitle}>
//               Enter the 6-digit code sent to {mobile}
//             </CustomText>

//             <View style={styles.otpRow}>
//               {digits.map((d, i) => (
//                 <TextInput
//                   key={i}
//                   ref={ref => {
//                     inputsRef.current[i] = ref;
//                   }}
//                   style={styles.otpBox}
//                   keyboardType="number-pad"
//                   maxLength={1}
//                   value={d}
//                   onChangeText={val => handleChange(i, val)}
//                   onKeyPress={e => handleKeyPress(i, e)}
//                   textAlign="center"
//                   importantForAutofill="no"
//                   placeholder="-"
//                 />
//               ))}
//             </View>

//             <CustomBtn
//               title={loading ? 'Verifying...' : 'Verify'}
//               onPress={handleVerifyOTP}
//               disabled={loading}
//             />

//             <CustomText style={styles.or}>Didn't receive? Resend</CustomText>
//           </View>
//         </View>
//       </ImageBackground>
//       {loading && (
//         <View style={styles.loadingOverlay} pointerEvents="none">
//           <ActivityIndicator size="large" color="#fff" />
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

export default OTPVerificationScreen;
