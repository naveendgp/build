import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgSelectedOrdersIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#038203"
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
    />
    <Path
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 22V12M3.29 7 12 12l8.71-5M7.5 4.27l9 5.15"
    />
  </Svg>
);
export default SvgSelectedOrdersIcon;
