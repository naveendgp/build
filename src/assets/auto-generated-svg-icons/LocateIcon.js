import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgLocateIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#038203"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M1.666 10h2.5M15.834 10h2.5M10 1.667v2.5M10 15.834v2.5M10 15.833a5.833 5.833 0 1 0 0-11.667 5.833 5.833 0 0 0 0 11.667"
    />
    <Path
      stroke="#038203"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"
    />
  </Svg>
);
export default SvgLocateIcon;
