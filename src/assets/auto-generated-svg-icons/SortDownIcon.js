import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgSortDownIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2 10.667 2.667 2.666 2.666-2.667M4.667 13.333V2.667M7.334 2.667H10"
    />
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.334 5.334H12M7.334 8H14"
    />
  </Svg>
);
export default SvgSortDownIcon;
