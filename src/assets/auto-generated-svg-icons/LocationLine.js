import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgLocationLine = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    fill="none"
    {...props}
  >
    <Path
      stroke="#595959"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.667 5.834c0 2.912-3.231 5.946-4.316 6.882a.58.58 0 0 1-.702 0c-1.085-.936-4.316-3.97-4.316-6.882a4.667 4.667 0 0 1 9.334 0"
    />
    <Path
      stroke="#595959"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 7.583a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5"
    />
  </Svg>
);
export default SvgLocationLine;
