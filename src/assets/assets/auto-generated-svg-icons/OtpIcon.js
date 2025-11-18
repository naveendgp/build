import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgOtpIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#292929"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2M12 18h.01"
    />
  </Svg>
);
export default SvgOtpIcon;
