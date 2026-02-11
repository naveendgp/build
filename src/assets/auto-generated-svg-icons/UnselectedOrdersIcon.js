import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgUnselectedOrdersIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={25}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 21.73a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4a2 2 0 0 0-1 1.73v8a2 2 0 0 0 1 1.73zM12.25 22V12"
    />
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m3.54 7 8.71 5 8.71-5M7.75 4.27l9 5.15"
    />
  </Svg>
);
export default SvgUnselectedOrdersIcon;
