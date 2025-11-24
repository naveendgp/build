import * as React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
const SvgEmptyIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={150}
    height={150}
    fill="none"
    {...props}
  >
    <Rect width={150} height={150} fill="#F6F6F6" rx={75} />
    <Circle cx={75} cy={75} r={57.857} fill="#D9D9D9" opacity={0.3} />
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M72.857 95.848a4.29 4.29 0 0 0 4.285 0l15-8.571a4.29 4.29 0 0 0 2.143-3.707V66.427a4.29 4.29 0 0 0-2.143-3.707l-15-8.572a4.29 4.29 0 0 0-4.285 0l-15 8.572a4.29 4.29 0 0 0-2.143 3.707V83.57a4.29 4.29 0 0 0 2.143 3.707zM75 96.429V75"
    />
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M56.335 64.285 75 75l18.665-10.714M65.357 58.434l19.285 11.035"
    />
  </Svg>
);
export default SvgEmptyIcon;
