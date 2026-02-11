import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { FONTFAMILY } from '../../constants';

interface CustomTextProps extends TextProps {
  fontWeight?: 'Regular' | 'Medium' | 'SemiBold' | 'Bold';
}

const CustomText: React.FC<CustomTextProps> = (props) => {
  const { style, ...rest } = props;

  const fontStyle = {
    fontFamily: FONTFAMILY.INTER_REGULAR,
  };

  return <Text allowFontScaling={false} style={[fontStyle, style]} {...rest} />;
};

export default CustomText;