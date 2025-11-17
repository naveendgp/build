import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const SvgLocationIcon = props => (
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
      d="M10 10.833a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
    />
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 18.333c-4.167-5-7.5-9.167-7.5-12.5a7.5 7.5 0 0 1 15 0c0 3.333-3.333 7.5-7.5 12.5Z"
    />
  </Svg>
);

export default SvgLocationIcon;

