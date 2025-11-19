import React from 'react';
import { Text, TextProps } from 'react-native';
import { FONTFAMILY } from '../../constants/fonts';

interface CustomTextProps extends TextProps {
  fontFamily?: string;
}

const CustomText: React.FC<CustomTextProps> = (props) => {
  const { fontFamily, style, ...rest } = props;

  const fontStyle = {
    fontFamily: fontFamily || FONTFAMILY.INTER_REGULAR,
  };

  return <Text allowFontScaling={false} style={[fontStyle, style]} {...rest} />;
};

export default CustomText;