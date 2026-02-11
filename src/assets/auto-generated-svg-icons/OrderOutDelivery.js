import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";
const SvgOrderOutDelivery = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <Rect width={48} height={48} fill="#D9D9D9" rx={24} />
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M23 33.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 33 28v-8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 15 20v8a2 2 0 0 0 1 1.73zM24 34V24"
    />
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.29 19 24 24l8.71-5M19.5 16.27l9 5.15"
    />
  </Svg>
);
export default SvgOrderOutDelivery;
