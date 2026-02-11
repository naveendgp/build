import React, { useState } from "react";
import {
  View,
  StyleSheet,
} from "react-native";
import CustomText from "../../../components/Text";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { useAuthStore } from "../../../state/zustand/authStore";
import LoginIcon from "../../../assets/auto-generated-svg-icons/LoginIcon";
import ProfileInput from "../../../components/ProfileInput";
import CustomBtn from "../../../components/CustomBtn";
import styles from "./styles";
import BackgroundGradient from "../../../components/backgroundGradient";
import { showErrorToast, showToast } from "../../../components/Toast/Toast";

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, "Login">;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { login, isLoading, clearError } = useAuthStore();

  const [mobile, setMobile] = useState("");
  const digitsOnly = mobile.replace(/\D/g, "");
  const isValidMobile = /^\d{10}$/.test(digitsOnly);

  const handleContinue = async () => {
    const digitsOnly = mobile.replace(/\D/g, "");
    if (!/^\d{10}$/.test(digitsOnly)) {
      showErrorToast("Please enter a valid phone number");
      return;
    }

    try {
      clearError();
      console.log("digitsOnly", digitsOnly);
      const res = await login(digitsOnly);
      if (res.success) {
        showToast("OTP sent successfully");
        navigation.navigate("OTPVerification", { mobile: digitsOnly });
      } else {
        showErrorToast(res.error || "Failed to send OTP");
      }
    } catch {
      showErrorToast("Network error occurred");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <View
        style={styles.gradientContainer}
      >

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
          title="Continue"
          onPress={handleContinue}
          loading={isLoading}
          disabled={isLoading || !isValidMobile}
          style={StyleSheet.flatten([
            styles.continueButton,
            (!isValidMobile || isLoading) ? { opacity: 0.6 } : undefined,
          ])}
          textStyle={styles.continueText}
        />

        <CustomText style={styles.footerText}>
          By continuing, you agree to our
          <CustomText
            style={styles.linkText}
            onPress={() => navigation.navigate("WebViewScreen", {
              url: "https://www.otterlaundry.com/terms",
              title: "Terms & Condition",
            })}
          > T&C </CustomText> and
          <CustomText
            style={styles.linkText}
            onPress={() => navigation.navigate("WebViewScreen", {
              url: "https://www.otterlaundry.com/privacy",
              title: "Privacy Policy",
            })}
          > Privacy policy.</CustomText>
        </CustomText>


      </View>
    </View>



  );
};

export default LoginScreen;
