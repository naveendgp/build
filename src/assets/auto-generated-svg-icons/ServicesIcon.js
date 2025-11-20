import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgServicesIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M4 16.589a3.09 3.09 0 0 1 3.092-3.09l6.87.002c.887 0 1.607.729 1.607 1.627s-.72 1.626-1.607 1.626c.593 0 1.146-.295 1.476-.787l2.614-3.712a1.584 1.584 0 0 1 2.043-.185c.819.575.754 1.669.219 2.474l-2.894 4.293a3.09 3.09 0 0 1-2.601 1.42H4M13.962 16.755H9.699M9.56 10.191h6.5c.661 0 1.197-.535 1.197-1.196V4.196c0-.66-.536-1.196-1.196-1.196H9.559c-.66 0-1.196.536-1.196 1.196v4.8c0 .66.536 1.195 1.196 1.195"
    />
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="m11.345 6.653 1.466-.731 1.466.731V3h-2.932z"
    />
  </Svg>
);
export default SvgServicesIcon;
