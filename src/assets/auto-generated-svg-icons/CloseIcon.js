import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const SvgCloseIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4 4 12M4 4l8 8"
    />
  </Svg>
);

export default SvgCloseIcon;

