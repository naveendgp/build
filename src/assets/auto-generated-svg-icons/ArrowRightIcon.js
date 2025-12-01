import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgArrowRightIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={7}
    height={13}
    fill="none"
    {...props}
  >
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m.5 12.5 6-6-6-6"
    />
  </Svg>
);
export default SvgArrowRightIcon;
