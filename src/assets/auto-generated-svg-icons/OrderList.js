import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";
const SvgOrderList = (props) => (
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
      d="M15 17h.01M15 24h.01M15 31h.01M20 17h13M20 24h13M20 31h13"
    />
  </Svg>
);
export default SvgOrderList;
