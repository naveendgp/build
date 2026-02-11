import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgCardStar = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      fill="#049D03"
      d="M9.604 1.913a.442.442 0 0 1 .792 0l1.925 3.899a1.77 1.77 0 0 0 1.33.967l4.304.63a.442.442 0 0 1 .245.753l-3.113 3.032a1.77 1.77 0 0 0-.51 1.565l.736 4.283a.442.442 0 0 1-.643.467l-3.848-2.024a1.77 1.77 0 0 0-1.644 0L5.33 17.51a.443.443 0 0 1-.642-.467l.735-4.283a1.77 1.77 0 0 0-.51-1.565L1.8 8.163a.442.442 0 0 1 .245-.755l4.304-.63a1.77 1.77 0 0 0 1.331-.966z"
    />
  </Svg>
);
export default SvgCardStar;
