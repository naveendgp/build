import * as React from "react";
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
const SvgFilterCloseIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <G
      stroke="#FCFCFC"
      strokeLinecap="round"
      strokeLinejoin="round"
      clipPath="url(#filter_close_icon_svg__a)"
    >
      <Path d="M8 14.667A6.667 6.667 0 1 0 8 1.334a6.667 6.667 0 0 0 0 13.333M10 6l-4 4M6 6l4 4" />
    </G>
    <Defs>
      <ClipPath id="filter_close_icon_svg__a">
        <Path fill="#fff" d="M0 0h16v16H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgFilterCloseIcon;
