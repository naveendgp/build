import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgRefreshIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <Path
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 8a6 6 0 0 1 6-6 6.5 6.5 0 0 1 4.493 1.827L14 5.333"
    />
    <Path
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 2v3.333h-3.334M14 8a6 6 0 0 1-6 6 6.5 6.5 0 0 1-4.493-1.827L2 10.667"
    />
    <Path
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.333 10.667H2V14"
    />
  </Svg>
);
export default SvgRefreshIcon;
