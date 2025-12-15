import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgHalfStar = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#049D03"
      d="M12 18.338c-.344 0-.683.083-.987.244L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.61-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16l2.31-4.679A.53.53 0 0 1 12 2"
    />
  </Svg>
);
export default SvgHalfStar;
