import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps {
  fontWeight?: 'Regular' | 'Medium' | 'SemiBold' | 'Bold';
}

const CustomText: React.FC<CustomTextProps> = (props) => {
  const { fontWeight = 'Regular', style, ...rest } = props;

  const fontStyle = {
    fontFamily: `Poppins-${fontWeight}`,
  };

  return <Text allowFontScaling={false} style={[fontStyle, style]} {...rest} />;
};

export default CustomText;