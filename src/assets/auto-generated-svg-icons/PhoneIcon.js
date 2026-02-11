import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgPhoneIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    fill="none"
    {...props}
  >
    <Path
      stroke="#038203"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.374 12.426a.75.75 0 0 0 .91-.227l.266-.349a1.5 1.5 0 0 1 1.2-.6H15a1.5 1.5 0 0 1 1.5 1.5V15a1.5 1.5 0 0 1-1.5 1.5A13.5 13.5 0 0 1 1.5 3 1.5 1.5 0 0 1 3 1.5h2.25A1.5 1.5 0 0 1 6.75 3v2.25a1.5 1.5 0 0 1-.6 1.2l-.351.263a.75.75 0 0 0-.219.925 10.5 10.5 0 0 0 4.794 4.788"
    />
  </Svg>
);
export default SvgPhoneIcon;
