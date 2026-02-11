import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgInvoiceDownload = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 12.5v-10M17.5 12.5v3.333a1.666 1.666 0 0 1-1.667 1.667H4.167A1.667 1.667 0 0 1 2.5 15.833V12.5"
    />
    <Path
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.833 8.333 10 12.5l4.167-4.167"
    />
  </Svg>
);
export default SvgInvoiceDownload;
