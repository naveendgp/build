import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const SvgCalendarIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    viewBox="0 0 20 20"
    {...props}
  >
    <Rect
      x={3}
      y={4}
      width={14}
      height={13}
      rx={2}
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={1.5}
      d="M3 8h14M7 3v5M13 3v5"
    />
  </Svg>
);

export default SvgCalendarIcon;

