import * as React from "react";
import Svg, {
  G,
  Path,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
} from "react-native-svg";
const SvgBg1 = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={390}
    height={844}
    fill="none"
    {...props}
  >
    <G clipPath="url(#bg1_svg__a)">
      <Path fill="#fff" d="M0 0h390v844H0z" />
      <Path fill="url(#bg1_svg__b)" d="M0 0h390v844H0z" />
    </G>
    <Defs>
      <LinearGradient
        id="bg1_svg__b"
        x1={265.475}
        x2={-94.214}
        y1={339}
        y2={-284}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#fff" />
        <Stop offset={1} stopColor="#00902D" />
      </LinearGradient>
      <ClipPath id="bg1_svg__a">
        <Path fill="#fff" d="M0 0h390v844H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgBg1;
