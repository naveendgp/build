import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgLocationIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#0F1112"
      d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1 1 16 0"
    />
    <Path fill="#86CA9B" d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
  </Svg>
);
export default SvgLocationIcon;
