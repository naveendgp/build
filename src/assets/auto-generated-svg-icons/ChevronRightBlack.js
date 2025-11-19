import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgChevronRightBlack = props => (
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
      d="m9 18 6-6-6-6"
    />
  </Svg>
);
export default SvgChevronRightBlack;
