import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgAddNoteIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <Path
      stroke="#038203"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.933 1.334H3.999a1.333 1.333 0 0 0-1.333 1.333v10.667a1.333 1.333 0 0 0 1.333 1.333h8a1.333 1.333 0 0 0 1.334-1.333V8.4M1.334 4h2.667M1.334 6.667h2.667M1.334 9.334h2.667M1.334 12h2.667"
    />
    <Path
      stroke="#038203"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.251 3.75a1.416 1.416 0 1 0-2.002-2.002l-3.34 3.341a1.33 1.33 0 0 0-.338.57l-.558 1.913a.333.333 0 0 0 .414.413l1.913-.558c.215-.063.41-.179.57-.337z"
    />
  </Svg>
);
export default SvgAddNoteIcon;
