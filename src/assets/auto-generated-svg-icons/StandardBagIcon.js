import * as React from "react";
import Svg, { Path, G, Rect } from "react-native-svg";

const SvgStandardBagIcon = (props) => (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none" {...props}>
        {/* Medium duffel bag icon */}
        <G>
            {/* Bag body - oval shape */}
            <Path
                d="M8 24C8 18 14 14 24 14C34 14 40 18 40 24V34C40 38 34 42 24 42C14 42 8 38 8 34V24Z"
                fill="#4169E1"
                stroke="#3357B5"
                strokeWidth={1.5}
            />
            {/* Top opening */}
            <Path
                d="M10 24C10 20 16 16 24 16C32 16 38 20 38 24"
                stroke="#3357B5"
                strokeWidth={2}
                fill="none"
            />
            {/* Handles */}
            <Path
                d="M16 14C16 10 18 8 24 8C30 8 32 10 32 14"
                stroke="#3357B5"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
            />
            {/* Side strap left */}
            <Rect x={6} y={26} width={4} height={8} rx={2} fill="#5577E8" stroke="#3357B5" strokeWidth={1} />
            {/* Side strap right */}
            <Rect x={38} y={26} width={4} height={8} rx={2} fill="#5577E8" stroke="#3357B5" strokeWidth={1} />
            {/* Center zipper */}
            <Path
                d="M20 28H28"
                stroke="#3357B5"
                strokeWidth={2}
                strokeLinecap="round"
            />
        </G>
    </Svg>
);

export default SvgStandardBagIcon;
