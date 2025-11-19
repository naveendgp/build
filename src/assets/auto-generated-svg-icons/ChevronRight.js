import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgChevronRight = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <Path
      stroke="#038203"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m6 12 4-4-4-4"
    />
  </Svg>
);
export default SvgChevronRight;
