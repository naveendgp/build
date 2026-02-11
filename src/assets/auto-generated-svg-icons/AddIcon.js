import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgAddIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#038203"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.167 10h11.666M10 4.167v11.667"
    />
  </Svg>
);
export default SvgAddIcon;
