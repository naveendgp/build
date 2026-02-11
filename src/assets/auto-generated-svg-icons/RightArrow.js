import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgRightArrow = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={27}
    height={27}
    fill="none"
    {...props}
  >
    <Path
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m20.25 9 4.5 4.5-4.5 4.5M2.25 13.5h22.5"
    />
  </Svg>
);
export default SvgRightArrow;
