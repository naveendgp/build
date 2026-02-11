import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgBackArrowIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#111"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m6 8-4 4 4 4M2 12h20"
    />
  </Svg>
);
export default SvgBackArrowIcon;
