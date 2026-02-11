import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgNotificationIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#0F1112"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.557 17.5a1.667 1.667 0 0 0 2.886 0M2.718 12.772a.833.833 0 0 0 .615 1.394h13.334a.833.833 0 0 0 .616-1.394C16.175 11.63 15 10.416 15 6.667a5 5 0 0 0-10 0c0 3.749-1.176 4.963-2.282 6.105"
    />
  </Svg>
);
export default SvgNotificationIcon;
