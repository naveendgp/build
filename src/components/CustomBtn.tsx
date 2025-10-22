import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';

type CustomBtnProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
};

const CustomBtn: React.FC<CustomBtnProps> = ({
  title,
  onPress,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabledButton]}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomBtn;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:10
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  disabledText: {
    color: '#EEE',
  },
});
