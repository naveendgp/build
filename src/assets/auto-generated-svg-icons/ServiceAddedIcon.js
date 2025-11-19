import * as React from 'react';
import Svg, {
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
const SvgServiceAddedIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={70}
    height={70}
    fill="none"
    {...props}
  >
    <Rect
      width={70}
      height={70}
      fill="url(#service_added_icon_svg__a)"
      rx={35}
    />
    <Circle cx={35} cy={35} r={27} fill="#04F604" />
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M41 29 30 40l-5-5M45 33l-7.5 7.5L36 39"
    />
    <Defs>
      <LinearGradient
        id="service_added_icon_svg__a"
        x1={35}
        x2={35}
        y1={0}
        y2={86.5}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#86FF86" />
        <Stop offset={1} stopColor="#DEFBDE" />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default SvgServiceAddedIcon;
