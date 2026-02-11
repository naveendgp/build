import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, FONTFAMILY } from '../constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

type CustomBtnProps = {
  title: string;
  title1?: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  variant?: ButtonVariant;
  strikeThroughText?: string;
};

const CustomBtn: React.FC<CustomBtnProps> = ({
  title,
  title1,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
  variant = 'primary',
  strikeThroughText,
}) => {
  const variantStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'secondary'
        ? styles.secondary
        : styles.outline;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        fullWidth && styles.fullWidth,
        variantStyle,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? COLORS.BOTTOM_BLACK : '#FFFFFF'} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.textBase, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CustomBtn;

const styles = StyleSheet.create({
  buttonBase: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  primary: { backgroundColor: COLORS.ONBOARDING_BUTTON },
  secondary: { backgroundColor: COLORS.BLACK },
  outline: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  textBase: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  disabledButton: { opacity: 0.7 },
  strikeThroughText: {
    textDecorationLine: 'line-through',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    marginRight: 8,
  },
});
