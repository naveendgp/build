import * as React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
const SvgOfferIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={22}
    height={22}
    fill="none"
    {...props}
  >
    <Rect width={22} height={22} fill="#1A73DA" rx={4} />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.25 4.25H5.75a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V5.75a1.5 1.5 0 0 0-1.5-1.5M13.25 8.75l-4.5 4.5M8.75 8.75h.008M13.25 13.25h.008"
    />
  </Svg>
);
export default SvgOfferIcon;
