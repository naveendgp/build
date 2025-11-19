import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const SvgEditIcon = props => (
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
      d="M11.333 2a1.414 1.414 0 0 1 2 2L5.333 13l-4 1 1-4L11.333 2Z"
    />
  </Svg>
);

export default SvgEditIcon;

