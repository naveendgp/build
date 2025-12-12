import * as React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
const SvgRatingUser = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={38}
    height={38}
    fill="none"
    {...props}
  >
    <Rect width={38} height={38} fill="#A2A2A2" rx={19} />
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M26 28v-2a4 4 0 0 0-4-4h-6a4 4 0 0 0-4 4v2M19 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8"
    />
  </Svg>
);
export default SvgRatingUser;
