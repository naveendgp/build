import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgLeftArrowWhiteIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m6 8-4 4 4 4M2 12h20"
    />
  </Svg>
);
export default SvgLeftArrowWhiteIcon;
