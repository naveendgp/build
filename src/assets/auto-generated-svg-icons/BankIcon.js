import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgBankIcon = props => (
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
      d="M10 18v-7M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.95-.22.95H3.474c-.53 0-.695-.717-.22-.95zM14 18v-7"
    />
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 18v-7M3 22h18M6 18v-7"
    />
  </Svg>
);
export default SvgBankIcon;
