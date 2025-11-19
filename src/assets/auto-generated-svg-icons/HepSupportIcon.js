import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgHepSupportIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    className="hepSupportIcon_svg__lucide hepSupportIcon_svg__lucide-message-circle-question-mark-icon hepSupportIcon_svg__lucide-message-circle-question-mark"
    {...props}
  >
    <Path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </Svg>
);
export default SvgHepSupportIcon;
