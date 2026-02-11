import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgStandardIcon20 = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.333 1.667h3.334"
    />
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m10 11.667 2.5-2.5M10 18.333A6.667 6.667 0 1 0 10 5a6.667 6.667 0 0 0 0 13.333"
    />
  </Svg>
);
export default SvgStandardIcon20;
