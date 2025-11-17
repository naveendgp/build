import React, { useState } from "react";
import {
  View,
  StatusBar,
  ScrollView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { COLORS, FONTFAMILY } from "../../../constants/colors";
import LoginIcon from "../../../assets/auto-generated-svg-icons/LoginIcon";
import ProfileInput from "../../../components/ProfileInput";
import CustomBtn from "../../../components/CustomBtn";
import styles from "./styles";
import BackgroundGradient from "../../../components/backgroundGradient";
import { showErrorToast, showSuccessToast } from "../../../utils/Toast";
import CustomText from "../../../components/Text";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../../apiService/api/authApi";
import {
  ErrorResponse as LoginErrorResponse,
  LoginPayload,
  LoginResponse,
} from "../../../apiService/types/authTypes";
import { AxiosError } from "axios";

const { width } = Dimensions.get("window");

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, "Login">;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const [mobile, setMobile] = useState("");

  const mutation = useMutation<
    LoginResponse,
    AxiosError<LoginErrorResponse>,
    LoginPayload
  >({
    mutationFn: payload => login(payload),
    onSuccess: (data, variables) => {
      console.log("Login API response:", data.message);
      showSuccessToast(data?.message || "OTP sent successfully");
      navigation.navigate("OTPVerification", { 
        mobile: variables.phone, 
        isRegister: false 
      });
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      console.log("Login API error:", msg);
      showErrorToast(msg || "Failed to send OTP");
    },
  });

  const handleContinue = async () => {
    const digitsOnly = mobile.replace(/\D/g, "");

    if (!/^\d{10}$/.test(digitsOnly)) {
      showErrorToast("Please enter a valid phone number");
      return;
    }

    try {
      console.log("digitsOnly", digitsOnly);
      mutation.mutate({ phone: digitsOnly });
    } catch {
      showErrorToast("Network error occurred");
    }
  };

  return (
    <View style={{ flex: 1 }}>
     
      <BackgroundGradient />

     
            <View style={styles.gradientContainer}>
              <View style={styles.iconContainer}>
                <LoginIcon width={58} height={58} />
              </View>

              <CustomText style={styles.title}>Enter Mobile Number</CustomText>

              <ProfileInput
                inputType="phone"
                value={mobile}
                onChangeText={setMobile}
                countryCode="+91"
                containerStyle={styles.profileInputContainer}
              />

              <CustomBtn
                title={mutation.isPending ? "Please wait..." : "Continue"}
                onPress={handleContinue}
                disabled={mutation.isPending}
                style={styles.continueButton}
                textStyle={styles.continueText}
              />

              <CustomText style={styles.footerText}>
                By continuing, you agree to our
                <CustomText style={styles.linkText}>  T&C </CustomText> and
                <CustomText style={styles.linkText}>  Privacy policy.</CustomText>
              </CustomText>
            </View>
          
    </View>
  );
};

export default LoginScreen;
