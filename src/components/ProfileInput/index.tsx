import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, TextInputProps, ViewStyle } from "react-native";
import CustomText from "../Text";
import { COLORS } from "../../constants";
import styles from "./styles";

export type InputType = "phone" | "email" | "normal";

interface ProfileInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  inputType?: InputType;
  containerStyle?: ViewStyle;
  countryCode?: string;
  value: string;
  onChangeText: (text: string) => void;
  isEditable?: boolean;
  isWhiteBG?: boolean;
  error?: string;
}

const ProfileInput: React.FC<ProfileInputProps> = ({
  label,
  required = false,
  inputType = "normal",
  containerStyle,
  countryCode = "+91",
  value,
  onChangeText,
  placeholder,
  isEditable = true,
  isWhiteBG = false,
  error,
  ...rest
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [mobileValue, setMobileValue] = useState("");
  const lastSentValueRef = useRef(value);
  const isUserInputRef = useRef(false);

  useEffect(() => {
    if (inputType === "phone") {
      const cleaned = value ? value.replace(/\D/g, "") : "";

      // Skip update if this is from our own onChangeText call
      if (isUserInputRef.current) {
        isUserInputRef.current = false;
        // Only update if the value is different from what we sent
        if (cleaned === lastSentValueRef.current) {
          return;
        }
      }

      setMobileValue(cleaned);
      setDisplayValue(`${countryCode} ${cleaned}`);
      lastSentValueRef.current = cleaned;
    } else {
      // Skip update if this is from our own onChangeText call
      if (isUserInputRef.current) {
        isUserInputRef.current = false;
        if (value === lastSentValueRef.current) {
          return;
        }
      }
      setDisplayValue(value);
      lastSentValueRef.current = value;
    }
  }, [value, inputType, countryCode]);

  const handleTextChange = (text: string) => {
    if (inputType !== "phone") {
      setDisplayValue(text);
      isUserInputRef.current = true;
      lastSentValueRef.current = text;
      onChangeText(text);
      return;
    }

    const prefix = `${countryCode} `; // "+91 "

    // 1. ALWAYS enforce prefix
    if (!text.startsWith(prefix)) {
      text = prefix; // user tried to delete prefix → restore
    }

    // 2. Extract only digits after prefix
    let digits = text.replace(prefix, "").replace(/\D/g, "");

    // 3. Restrict to 10 digits
    if (digits.length > 10) digits = digits.slice(0, 10);

    // 4. Update display + parent state
    setMobileValue(digits);
    setDisplayValue(prefix + digits);

    // Mark as user input and track what we're sending
    isUserInputRef.current = true;
    lastSentValueRef.current = digits;
    onChangeText(digits);
  };
  const getKeyboardType = () => {
    switch (inputType) {
      case "phone":
        return "number-pad";
      case "email":
        return "email-address";
      default:
        return rest.keyboardType || "default";
    }
  };

  const getAutoCapitalize = () => {
    switch (inputType) {
      case "email":
        return "none";
      case "normal":
        return rest.autoCapitalize || "words";
      default:
        return "none";
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (inputType) {
      case "phone":
        return `${countryCode} 947512560`;
      case "email":
        return "example@email.com";
      default:
        return label ? `Enter ${label.toLowerCase()}` : "Enter text";
    }
  };

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <CustomText style={styles.label}>
          {label}
          {required && <CustomText style={styles.asterisk}>*</CustomText>}
        </CustomText>
      )}
      <View
        style={[
          styles.inputRow,
          isWhiteBG && { backgroundColor: COLORS.BUTTON_BACKGROUND },
          !isEditable && styles.inputRowDisabled,
          !!error && styles.inputRowError,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            !isEditable && styles.inputDisabledText, // Full opacity for text when disabled
          ]}
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder={getPlaceholder()}
          placeholderTextColor={COLORS.PHONE_PLACEHOLDER}
          keyboardType={getKeyboardType()}
          autoCapitalize={getAutoCapitalize()}
          maxLength={inputType === "phone" ? 14 : rest.maxLength}
          editable={isEditable}
          {...rest}
        />
      </View>
      {error ? <CustomText style={styles.errorText}>{error}</CustomText> : null}
    </View>
  );
};

export default ProfileInput;

