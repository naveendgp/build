import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import CustomText from "../../../components/Text";
import CustomBtn from "../../../components/CustomBtn";
import styles from "./styles";
import { useAuthStore } from "../../../state/zustand/authStore";
import { STRINGS } from "../../../constants";
import OTPVerificationIcon from "../../../assets/auto-generated-svg-icons/OtpIcon";
import SvgTimerIcon from "../../../assets/auto-generated-svg-icons/TimerIcon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showErrorToast, showToast } from "../../../components/Toast/Toast";
import BackgroundGradient from "../../../components/backgroundGradient";
import { getFcmToken } from '../../../services/Notification/useNotifications';

const { width } = Dimensions.get("window");

type OTPNavProp = NativeStackNavigationProp<RootStackParamList, "OTPVerification">;
type OTPRouteProp = RouteProp<RootStackParamList, "OTPVerification">;

const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPNavProp>();
  const route = useRoute<OTPRouteProp>();
  const { mobile } = route.params;

  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { verifyOtp, resendOtp, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else {
      setIsResendEnabled(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Focus first input on mount (optional)
  useEffect(() => {
    getFcmToken();
    setTimeout(() => inputsRef.current[0]?.focus(), 300);
  }, []);

  const handleChange = (index: number, value: string) => {
    // strip non-digits
    const cleanVal = value.replace(/\D/g, "");

    // Handle Paste of 4-digit OTP (or longer pastes where we take the last 4)
    if (cleanVal.length >= 4) {
      const otp = cleanVal.slice(-4).split("");
      setDigits(otp);
      inputsRef.current[3]?.focus();
      return;
    }

    // If user pasted multiple digits (2 or 3) or fast typed: distribute across inputs
    if (cleanVal.length > 1) {
      const next = [...digits];
      const chars = cleanVal.split("");
      for (let i = 0; i < chars.length && index + i < next.length; i++) {
        next[index + i] = chars[i];
      }
      setDigits(next);

      // focus the next empty input (or last if full)
      const nextEmpty = next.findIndex((ch, i) => ch === "" && i > index);
      if (nextEmpty !== -1) {
        inputsRef.current[nextEmpty]?.focus();
      } else {
        inputsRef.current[Math.min(index + chars.length, next.length - 1)]?.focus();
      }
      return;
    }

    // Single char behavior
    const next = [...digits];
    // If we have "1" and user typed "2" (resulting in "12" caught above), handled.
    // If we selected "1" and typed "2" -> value is "2".
    next[index] = cleanVal;
    setDigits(next);
    if (cleanVal && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === "Backspace") {
      if (digits[index] === "" && index > 0) {
        inputsRef.current[index - 1]?.focus();
        // clear previous box too (optional)
        const prev = [...digits];
        prev[index - 1] = "";
        setDigits(prev);
      } else {
        // delete current
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      }
    }
  };

  const otpValue = digits.join("");
  const isValidOtp = /^\d{4}$/.test(otpValue);

  const handleVerifyOTP = async () => {
    if (!/^\d{4}$/.test(otpValue)) {
      showErrorToast("Please enter a valid 4-digit OTP");
      return;
    }

    try {
      clearError();
      const res = await verifyOtp(mobile, otpValue);
      if (res.success) {
        showToast("OTP verified successfully");
        if (res.isNew) {
          await AsyncStorage.setItem(STRINGS.IS_INIT_PROFILE_ADDRESS_UPDATED, "false");
          navigation.reset({
            index: 0,
            routes: [{ name: "ProfileDataScreen", params: { fromOtp: true, phoneNumber: mobile } }],
          });
        } else {
          navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
        }
      } else {
        showErrorToast(res.error || "OTP verification failed");
      }
    } catch (err) {
      showErrorToast("Something went wrong");
    }
  };

  const handleResend = async () => {
    if (isResending || !isResendEnabled) return;

    try {
      setIsResending(true);
      clearError();

      const formattedPhone = mobile.startsWith("+") ? mobile : `+91${mobile}`;
      const res = await resendOtp(formattedPhone);
      if (res.success) {
        showToast("OTP resent successfully");
        setTimer(30);
        setIsResendEnabled(false);
        // clear previous digits and focus first
        setDigits(["", "", "", ""]);
        inputsRef.current[0]?.focus();
      } else {
        showErrorToast(res.error || "Failed to resend OTP");
      }
    } catch (err) {
      showErrorToast("Something went wrong");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />

      <View style={styles.mainSection}>
        <View style={styles.iconBox}>
          <OTPVerificationIcon width={56} height={56} />
        </View>
        <CustomText style={styles.title}>Enter Verification Code</CustomText>
        <View style={styles.subtitleContainer}>
          <CustomText style={styles.subtitle}>
            A 4-digit verification code has been sent to
          </CustomText>
          <CustomText style={styles.phoneNumber}>+91 {mobile}</CustomText>
        </View>

        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputsRef.current[i] = ref;
              }}
              style={[styles.otpBox, i < digits.length - 1 && { marginRight: 12 }]}
              keyboardType="number-pad"
              // Allow paste of full OTP
              maxLength={4}
              selectTextOnFocus
              value={d}
              onChangeText={(val) => handleChange(i, val)}
              onKeyPress={(e) => handleKeyPress(i, e)}
              textAlign="center"
              returnKeyType={i === digits.length - 1 ? "done" : "next"}
              onSubmitEditing={() => {
                if (i < digits.length - 1) inputsRef.current[i + 1]?.focus();
                else handleVerifyOTP();
              }}
              // iOS one-time-code autofill hint
              textContentType={Platform.OS === "ios" ? "oneTimeCode" : "none"}
              importantForAutofill="yes"
            />
          ))}
        </View>

        <View style={styles.timerRow}>
          <View style={styles.timerContainer}>
            <SvgTimerIcon width={14} height={14} />
            <CustomText style={styles.timerText}>
              {timer < 10 ? `00:0${timer}` : `00:${timer}`}
            </CustomText>
          </View>
          <TouchableOpacity disabled={!isResendEnabled || isResending} onPress={handleResend}>
            <CustomText
              style={[
                styles.resendText,
                { opacity: isResendEnabled && !isResending ? 1 : 0.4 },
              ]}
            >
              {isResending ? "Sending..." : "Resend OTP"}
            </CustomText>
          </TouchableOpacity>
        </View>

        <CustomBtn
          title="Submit"
          onPress={handleVerifyOTP}
          loading={isLoading}
          disabled={isLoading || !isValidOtp}
          style={StyleSheet.flatten([
            styles.submitBtn,
            (!isValidOtp || isLoading) ? { opacity: 0.6 } : undefined,
          ])}
          textStyle={styles.continueText}
        />
      </View>
    </View>
  );
};

export default OTPVerificationScreen;
