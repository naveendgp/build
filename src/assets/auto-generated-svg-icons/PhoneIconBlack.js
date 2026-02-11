import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgPhoneIconBlack = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.526 13.807a.834.834 0 0 0 1.01-.253l.297-.388a1.67 1.67 0 0 1 1.333-.666h2.5a1.666 1.666 0 0 1 1.667 1.666v2.5a1.666 1.666 0 0 1-1.667 1.667 15 15 0 0 1-15-15 1.667 1.667 0 0 1 1.667-1.666h2.5a1.667 1.667 0 0 1 1.666 1.666v2.5a1.67 1.67 0 0 1-.666 1.334l-.39.292a.83.83 0 0 0-.244 1.027 11.67 11.67 0 0 0 5.327 5.32"
    />
  </Svg>
);
export default SvgPhoneIconBlack;
