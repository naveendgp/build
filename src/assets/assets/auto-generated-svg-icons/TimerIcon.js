import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgTimerIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    fill="none"
    {...props}
  >
    <Path
      stroke="#595959"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.833 1.167h2.334M7 8.167l1.75-1.75M7 12.833A4.667 4.667 0 1 0 7 3.5a4.667 4.667 0 0 0 0 9.333"
    />
  </Svg>
);
export default SvgTimerIcon;
