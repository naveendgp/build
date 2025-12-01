import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgTagIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M19.468 3.054H12.25l-8.762 8.762c-.58.58-.58 1.528 0 2.107l6.601 6.601c.58.58 1.528.58 2.108 0l8.762-8.761V4.544c0-.82-.67-1.49-1.49-1.49"
    />
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M17.448 8.252a1.194 1.194 0 1 1-1.688-1.688 1.194 1.194 0 0 1 1.688 1.688"
    />
  </Svg>
);
export default SvgTagIcon;
