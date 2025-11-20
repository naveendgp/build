import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgLockIcon = props => (
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
      d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2M7 11V7a5 5 0 1 1 10 0v4"
    />
  </Svg>
);
export default SvgLockIcon;
