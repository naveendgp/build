import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";
const SvgOrderPhone = (props) => (
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
      d="M29 14H19a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2M24 30h.01"
    />
  </Svg>
);
export default SvgOrderPhone;
