import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (inputType === "phone") {
      // Remove country code and spaces from value
      // const cleaned = value ? value.replace(countryCode, "").replace(/\s/g, "").trim() : "";
      const cleaned = value ? value.replace(/\D/g, "") : "";
      setMobileValue(cleaned);
      setDisplayValue(cleaned ? `${countryCode} ${cleaned}` : countryCode);
    } else {
      setDisplayValue(value);
    }
  }, [value, inputType, countryCode]);

  // const handleTextChange = (text: string) => {
  //   if (inputType === "phone") {
  //     // Handle phone number with country code
  //     // Remove country code prefix if user tries to type it
  //     let cleaned = text.replace(new RegExp(countryCode.replace("+", "\\+"), "g"), "");
  //     cleaned = cleaned.replace(/\s/g, "").trim();

  //     // Only allow digits
  //     const digitsOnly = cleaned.replace(/\D/g, "");

  //     if (digitsOnly.length <= 10) {
  //       setMobileValue(digitsOnly);
  //       const formattedValue = digitsOnly ? `${countryCode} ${digitsOnly}` : countryCode;
  //       setDisplayValue(formattedValue);
  //       onChangeText(digitsOnly);
  //     }
  //   } else {
  //     setDisplayValue(text);
  //     onChangeText(text);
  //   }
  // };
  const handleTextChange = (text: string) => {
    if (inputType !== "phone") {
      setDisplayValue(text);
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
          style={styles.input}
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

