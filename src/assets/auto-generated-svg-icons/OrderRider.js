import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";
const SvgOrderRider = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <Rect width={48} height={48} fill="#D9D9D9" rx={24} />
    <Path
      stroke="#292929"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M22.667 32.333h-2.222a1.78 1.78 0 0 1-1.778-1.778v-6.31a5.333 5.333 0 1 1 10.667 0v6.31c0 .982-.796 1.778-1.778 1.778h-2.222"
    />
    <Path
      stroke="#292929"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M26.666 16.244a2.667 2.667 0 1 1-5.333 0 2.667 2.667 0 0 1 5.333 0M29.778 15.356h2.223"
    />
    <Path
      stroke="#292929"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="m25.498 18.45 4.28-1.316v-1.778H26.51M18.222 15.356H16M22.501 18.45l-4.279-1.316v-1.778h3.266M25.334 29.667h-2.667v4a1.333 1.333 0 0 0 2.667 0zM21.333 29.667h5.333v-.889a2.667 2.667 0 1 0-5.333 0zM20.295 20.414a4 4 0 0 0 7.411 0"
    />
  </Svg>
);
export default SvgOrderRider;
