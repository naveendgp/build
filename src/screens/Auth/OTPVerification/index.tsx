import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import styles from './styles';
import { useRoute } from '@react-navigation/native';
import CustomBtn from '../../../components/CustomBtn';
import CustomText from '../../../components/Text';
import { isValidateOTP } from '../../../utils/Validation';
import { useOtpInput } from './hooks/useOtpInput';
import { useOtpVerification } from './hooks/useOtpVerification';
import { useOtpResend } from './hooks/useOtpResend';
import BackgroundGradient from '../../../components/backgroundGradient';
import { COLORS } from '../../../constants/colors';
import SvgTimerIcon from '../../../assets/auto-generated-svg-icons/TimerIcon';
import SvgOTPVerificationIcon from '../../../assets/auto-generated-svg-icons/OtpIcon';

const OTPVerificationScreen: React.FC = () => {
  const route = useRoute<any>();
  const { mobile, isRegister } = route.params;

  const { digits, otp, handleChange, handleKeyPress, inputsRef } =
    useOtpInput(4);
  const mutation = useOtpVerification(mobile);
  const { timer, isResendEnabled, handleResend, isResending } = useOtpResend(mobile);

  const handleVerifyOtp = () => {
    if (!isValidateOTP(otp)) return;
    mutation.mutate(otp);
  };

  const isLoading = mutation.isPending;

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />

      <View style={styles.mainSection}>
        <View style={styles.iconBox}>
          <SvgOTPVerificationIcon width={56} height={56} />
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
              ref={ref => {
                inputsRef.current[i] = ref;
              }}
              style={[
                styles.otpBox,
                i < digits.length - 1 && { marginRight: 12 },
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={d}
              onChangeText={val => handleChange(i, val)}
              onKeyPress={e => handleKeyPress(i, e)}
              textAlign="center"
            />
          ))}
        </View>

        <View style={styles.timerRow}>
          <View style={styles.timerContainer}>
            <SvgTimerIcon width={14} height={14} color={COLORS.LOGIN_SUBTITLE} />
            <CustomText style={styles.timerText}>
              {timer < 10 ? `00:0${timer}` : `00:${timer}`}
            </CustomText>
          </View>
          <TouchableOpacity
            disabled={!isResendEnabled || isResending}
            onPress={handleResend}
          >
            <CustomText
              style={[
                styles.resendText,
                { opacity: isResendEnabled && !isResending ? 1 : 0.4 },
              ]}
            >
              Resend OTP
            </CustomText>
          </TouchableOpacity>
        </View>

        <CustomBtn
          title="Submit"
          onPress={handleVerifyOtp}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitBtn}
          textStyle={styles.continueText}
        />
      </View>
    </View>
  );
};

export default OTPVerificationScreen;
