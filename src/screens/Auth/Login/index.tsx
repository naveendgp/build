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
import { COLORS, FONTFAMILY } from "../../../constants/colors";
import LoginIcon from "../../../assets/auto-generated-svg-icons/LoginIcon";
import ProfileInput from "../../../components/ProfileInput";
import CustomBtn from "../../../components/CustomBtn";
import styles from "./styles";
import BackgroundGradient from "../../../components/backgroundGradient";
import { showErrorToast } from "../../../utils/Toast";
import CustomText from "../../../components/Text";
import { useLogin } from "./hooks/useLogin";

const { width } = Dimensions.get("window");

const LoginScreen: React.FC = () => {
  const [mobile, setMobile] = useState("");
  const mutation = useLogin();

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
                isWhiteBG={true}
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
