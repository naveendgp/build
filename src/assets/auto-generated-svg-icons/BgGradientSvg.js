import * as React from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
const SvgBgGradientSvg = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={390}
    height={844}
    fill="none"
    {...props}
  >
    <Path fill="url(#bg_gradient_svg_svg__a)" d="M0 0h390v844H0z" />
    <Defs>
      <LinearGradient
        id="bg_gradient_svg_svg__a"
        x1={265.475}
        x2={-94.214}
        y1={339}
        y2={-284}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#fff" />
        <Stop offset={1} stopColor="#00902D" />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default SvgBgGradientSvg;
