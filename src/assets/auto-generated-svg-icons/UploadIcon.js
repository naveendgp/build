import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgUploadIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#404040"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v12M17 8l-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
    />
  </Svg>
);
export default SvgUploadIcon;
