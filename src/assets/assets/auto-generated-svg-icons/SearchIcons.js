import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgSearchIcons = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#595959"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-4.34-4.34M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16"
    />
  </Svg>
);
export default SvgSearchIcons;
