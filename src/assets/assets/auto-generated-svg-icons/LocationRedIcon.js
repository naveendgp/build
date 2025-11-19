import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
const SvgLocationRedIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <Path
      fill="#BB1F15"
      d="M19.79 2a11.79 11.79 0 0 1 11.788 11.79c0 7.357-8.162 15.02-10.903 17.386a1.474 1.474 0 0 1-1.772 0C16.162 28.809 8 21.146 8 13.789A11.79 11.79 0 0 1 19.79 2m0 7.367a4.42 4.42 0 1 0 0 8.841 4.42 4.42 0 0 0 0-8.84"
    />
    <Circle cx={19.936} cy={34.863} r={2.21} fill="#BB1F15" />
  </Svg>
);
export default SvgLocationRedIcon;
