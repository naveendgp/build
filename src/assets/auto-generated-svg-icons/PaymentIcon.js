import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgPaymentIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#404040"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.666 4.167H3.333c-.92 0-1.667.746-1.667 1.666v8.334c0 .92.746 1.666 1.667 1.666h13.333c.92 0 1.667-.746 1.667-1.667V5.833c0-.92-.746-1.666-1.667-1.666M1.666 8.334h16.667"
    />
  </Svg>
);
export default SvgPaymentIcon;
