import React, { useEffect, useState } from 'react';
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
import CustomBtn from '../../../components/CustomBtn';
import CustomText from '../../../components/Text';
import styles from './styles.ts';
import CustomToast from '../../../components/CustomToast.tsx';
import { useMutation } from '@tanstack/react-query';
import {
  ErrorResponse,
  RegisterPayload,
  RegisterResponse,
} from '../../../apiService/types/authTypes.ts';
import { AxiosError } from 'axios';
import { register } from '../../../apiService/api/authApi.ts';
import { validateMobile } from '../../../utils/Validation.ts';
import { showErrorToast, showSuccessToast } from '../../../utils/Toast.ts';

type RegisterNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavProp>();
  //const { mobile, setMobile, handleRegister, isLoading } = useRegisterScreen();
  const [mobile, setMobile] = useState('');

  const mutation = useMutation<
    RegisterResponse,
    AxiosError<ErrorResponse>,
    RegisterPayload
  >({
    mutationFn: payload => register(payload),
    onSuccess: data => {
      showSuccessToast(data?.message);
      navigation.navigate('OTPVerification', { mobile, isRegister: true });
      console.log('Login API response:', data.message);
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      showErrorToast(msg);
      console.log('Login API error:', msg);
    },
  });

  const handleRegister = () => {
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
                onChangeText={setMobile}
                placeholderTextColor="#9AA0A6"
              />
            </View>

            <CustomBtn
              title={mutation.isPending ? 'Please wait...' : 'Register'}
              onPress={() => handleRegister()}
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
                Already have an account?
              </CustomText>
              <TouchableOpacity onPress={() => navigation.pop()}>
                <CustomText style={styles.secondaryText}>Sign in</CustomText>
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

// const RegisterScreen: React.FC = () => {
//   const navigation = useNavigation<RegisterNavProp>();

//   // 🔹 Global store values
//   const setMobile = useUserStore(state => state.setMobile);
//   const register = useAuthStore(state => state.register);
//   const isLoading = useAuthStore(state => state.isLoading);
//   const error = useAuthStore(state => state.error);
//   const signupData = useAuthStore(state => state.signupData);
//   const clearError = useAuthStore(state => state.clearError);

//   // 🔹 Local state
//   const [mobile, setLocalMobile] = useState('');

//   // 🔹 Send OTP (trigger API)
//   const handleSendOTP = async () => {
//     const digitsOnly = mobile.replace(/\D/g, '');
//     if (!/^\d{10}$/.test(digitsOnly)) {
//       Alert.alert(
//         'Invalid number',
//         'Please enter a valid 10-digit mobile number',
//       );
//       return;
//     }

//     clearError();
//     setMobile(digitsOnly);

//     try {
//       await register(digitsOnly); // just trigger the API
//     } catch (err) {
//       console.error('Register error:', err);
//     }
//   };

//   // 🔹 Watch for API success or failure
//   useEffect(() => {
//     if (error) {
//       Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
//     }
//   }, [error]);

//   // 🔹 Navigate when signupData available (API success)
//   useEffect(() => {
//     if (signupData && signupData.phone) {
//       navigation.navigate('OTPVerification', {
//         mobile: signupData.phone,
//         isRegister: true,
//       });
//     }
//   }, [signupData]);

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ImageBackground
//         source={require('../../../assets/background/bg.png')}
//         style={styles.background}
//         resizeMode="cover"
//       >
//         <View style={styles.wrapper}>
//           <View style={styles.card}>
//             <CustomText style={styles.title}>Create account</CustomText>
//             <CustomText style={styles.subtitle}>
//               Join us — enter your mobile number to get started
//             </CustomText>

//             <View style={styles.inputRow}>
//               <View style={styles.codeBox}>
//                 <CustomText style={styles.codeText}>+91</CustomText>
//               </View>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter mobile number"
//                 keyboardType="number-pad"
//                 maxLength={10}
//                 value={mobile}
//                 onChangeText={setLocalMobile}
//                 placeholderTextColor="#9AA0A6"
//               />
//             </View>

//             <CustomBtn
//               title={isLoading ? 'Please wait...' : 'Register'}
//               onPress={handleSendOTP}
//               disabled={isLoading}
//             />

//             <View
//               style={{
//                 flexDirection: 'row',
//                 justifyContent: 'center',
//                 marginTop: 20,
//               }}
//             >
//               <CustomText style={styles.forgot}>
//                 Already have an account?
//               </CustomText>
//               <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//                 <CustomText style={styles.secondaryText}>Sign in</CustomText>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </ImageBackground>

//       {isLoading && (
//         <View style={styles.loadingOverlay} pointerEvents="none">
//           <ActivityIndicator size="large" color="#fff" />
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

export default RegisterScreen;
