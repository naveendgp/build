import * as React from "react";
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
const SvgSupportMsgIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <G clipPath="url(#support_msg_icon_svg__a)">
      <Path
        stroke="#F6F6F6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1.995 10.895c.098.247.12.518.063.778l-.71 2.193a.666.666 0 0 0 .824.779l2.275-.666c.245-.048.5-.027.733.062a6.667 6.667 0 1 0-3.185-3.146"
      />
    </G>
    <Defs>
      <ClipPath id="support_msg_icon_svg__a">
        <Path fill="#fff" d="M0 0h16v16H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgSupportMsgIcon;
