import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgUnselectedProfileIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 21v-2.333a4.72 4.72 0 0 0-1.339-3.3A4.53 4.53 0 0 0 15.43 14H8.57a4.53 4.53 0 0 0-3.232 1.367A4.72 4.72 0 0 0 4 18.667V21M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"
    />
  </Svg>
);
export default SvgUnselectedProfileIcon;
