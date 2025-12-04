import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgEditIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#038203"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.5 17.5h15M10.186 4.857l1.65-1.65a1 1 0 0 1 1.414 0l2.71 2.71a1 1 0 0 1 0 1.415l-1.65 1.65m-4.124-4.125L5.514 9.529a.83.83 0 0 0-.244.59v2.779a1 1 0 0 0 1 1h2.78a.83.83 0 0 0 .588-.244l4.673-4.672m-4.125-4.125 4.125 4.125"
    />
  </Svg>
);
export default SvgEditIcon;
