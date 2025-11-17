import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const SvgRightArrowIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    viewBox="0 0 20 20"
    {...props}
  >
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m7.5 15 5-5-5-5"
    />
  </Svg>
);

export default SvgRightArrowIcon;

