import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgSupportIcon = (props) => (
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
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10M4.93 4.93l4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"
    />
    <Path
      stroke="#292929"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8"
    />
  </Svg>
);
export default SvgSupportIcon;
