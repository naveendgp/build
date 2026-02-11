import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgExpressIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    fill="none"
    {...props}
  >
    <Path
      stroke="#393939"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.372 2.859c.062-.496-.56-.766-.88-.382l-4.059 4.87a.5.5 0 0 0 .385.82h3.616a.5.5 0 0 1 .496.562l-.302 2.412c-.062.495.56.766.88.382l4.059-4.87a.5.5 0 0 0-.385-.82H7.567a.5.5 0 0 1-.496-.562z"
    />
  </Svg>
);
export default SvgExpressIcon;
