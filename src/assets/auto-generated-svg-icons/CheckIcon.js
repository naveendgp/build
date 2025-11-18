import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const SvgCheckIcon = props => (
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
      d="M13 4 6 11l-3-3"
    />
  </Svg>
);

export default SvgCheckIcon;

