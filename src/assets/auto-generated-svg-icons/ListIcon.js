import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgListIcon = (props) => (
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
      d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"
    />
  </Svg>
);
export default SvgListIcon;
