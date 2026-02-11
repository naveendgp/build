import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTFAMILY } from '../constants/fonts';
import { theme } from '../utils/theme';

interface ErrorHandleProps {
  msg: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const ErrorHandle: React.FC<ErrorHandleProps> = ({ msg, style, textStyle }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.message, textStyle]}>{msg}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.GRAY,
    textAlign: 'center',
  },
});

export default ErrorHandle;