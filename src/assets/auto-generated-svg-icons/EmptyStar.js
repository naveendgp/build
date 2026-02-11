import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgEmptyStar = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <Path
      stroke="#646464"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.208 3.825a.884.884 0 0 1 1.584 0l3.85 7.799a3.54 3.54 0 0 0 2.658 1.933l8.61 1.26a.884.884 0 0 1 .49 1.507l-6.227 6.063a3.54 3.54 0 0 0-1.018 3.13l1.47 8.567a.884.884 0 0 1-1.285.933l-7.697-4.047a3.54 3.54 0 0 0-3.288 0l-7.695 4.047a.883.883 0 0 1-1.283-.933l1.468-8.565a3.54 3.54 0 0 0-1.018-3.132L3.6 16.326a.883.883 0 0 1 .49-1.51l8.608-1.259a3.54 3.54 0 0 0 2.662-1.933z"
    />
  </Svg>
);
export default SvgEmptyStar;
