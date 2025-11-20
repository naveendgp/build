import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgLogoutBlackIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    className="logout_black_icon_svg__lucide logout_black_icon_svg__lucide-log-out-icon logout_black_icon_svg__lucide-log-out"
    {...props}
  >
    <Path d="m16 17 5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </Svg>
);
export default SvgLogoutBlackIcon;
