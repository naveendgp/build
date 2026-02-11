import * as React from "react";
import Svg, {
  G,
  Path,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
} from "react-native-svg";
const SvgBg2 = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={400}
    height={844}
    viewBox="0 0 400 844"
    fill="none"
    {...props}
  >
    <G clipPath="url(#bg2_svg__a)">
      <Path fill="#fff" d="M0 0h400v844H0z" />
      <Path fill="url(#bg2_svg__b)" d="M0 0h400v844H0z" />
    </G>
    <Defs>
      <LinearGradient
        id="bg2_svg__b"
        x1={272.282}
        x2={-82.798}
        y1={339}
        y2={-291.786}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#fff" />
        <Stop offset={1} stopColor="#00902D" />
      </LinearGradient>
      <ClipPath id="bg2_svg__a">
        <Path fill="#fff" d="M0 0h400v844H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgBg2;
