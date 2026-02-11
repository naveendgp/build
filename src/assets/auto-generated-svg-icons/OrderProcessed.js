import * as React from "react";
import Svg, { Rect, Path, Circle } from "react-native-svg";
const SvgOrderProcessed = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <Rect width={48} height={48} fill="#ADC3FE" rx={24} />
    <Path fill="#ADC3FE" d="M12 12h24v24H12z" />
    <Circle cx={24} cy={24} r={6} fill="#1562BB" />
  </Svg>
);
export default SvgOrderProcessed;
