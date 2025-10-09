import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  Text,
  StyleSheet,
} from 'react-native';
import styles from './styles';
import SfIcon from '../Icon';

type Props = TextInputProps & {
  containerStyle?: ViewStyle;
  label?: string;
  required?: boolean;
  error?: string;
  icon?: {
    type: string;
    name: string;
  };
};

const CustomTextInput: React.FC<Props> = ({
  containerStyle,
  style,
  label,
  required,
  error,
  icon,
  ...rest
}) => {
  const inputComponent = (
    <>
      <View style={[styles.container, containerStyle]}>
        <TextInput
          allowFontScaling={false}
          style={[styles.input, style]}
          placeholderTextColor="#9AA0A6"
          numberOfLines={1}
          autoCapitalize="words"
          {...rest}
        />
        {icon && (
          <View style={innerStyles.iconPosition}>
            <SfIcon
              type={icon.type}
              name={icon.name}
              size={16}
              color={'#fff'}
            />
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  if (!label) {
    return inputComponent;
  }

  return (
    <View>
      <Text style={styles.labelText}>
        {label}
        {required && <Text style={{ color: '#000000' }}> *</Text>}
      </Text>
      {inputComponent}
    </View>
  );
};

export default CustomTextInput;

const innerStyles = StyleSheet.create({
  iconPosition: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
