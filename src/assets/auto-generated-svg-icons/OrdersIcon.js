import * as React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
const SvgOrdersIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    className="ordersIcon_svg__lucide ordersIcon_svg__lucide-clipboard-list-icon ordersIcon_svg__lucide-clipboard-list"
    {...props}
  >
    <Rect width={8} height={4} x={8} y={2} rx={1} ry={1} />
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01" />
  </Svg>
);
export default SvgOrdersIcon;
