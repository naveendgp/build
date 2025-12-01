import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgCountownIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#292929"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.334 1.667h3.333M10 11.667l2.5-2.5M10 18.333A6.667 6.667 0 1 0 10 5a6.667 6.667 0 0 0 0 13.333"
    />
  </Svg>
);
export default SvgCountownIcon;
