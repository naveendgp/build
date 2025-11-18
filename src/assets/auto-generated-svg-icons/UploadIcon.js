import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const SvgUploadIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 10v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8M12 3v11m0 0-4-4m4 4 4-4"
    />
  </Svg>
);

export default SvgUploadIcon;

