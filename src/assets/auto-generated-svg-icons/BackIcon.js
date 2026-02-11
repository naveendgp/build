import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgBackIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <Path
      stroke="#111"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m14 16-4 4 4 4M10 20h20"
    />
  </Svg>
);
export default SvgBackIcon;
