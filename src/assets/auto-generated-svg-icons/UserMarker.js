import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgUserMarker = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <Path
      fill="#BB1F15"
      d="M33.333 16.666c0 8.322-9.231 16.989-12.331 19.665a1.666 1.666 0 0 1-2.004 0c-3.1-2.676-12.331-11.343-12.331-19.665a13.333 13.333 0 0 1 26.666 0"
    />
    <Path fill="#FCFCFC" d="M20 21.667a5 5 0 1 0 0-10 5 5 0 0 0 0 10" />
  </Svg>
);
export default SvgUserMarker;
