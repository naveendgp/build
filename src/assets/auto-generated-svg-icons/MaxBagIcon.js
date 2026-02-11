import * as React from "react";
import Svg, { Path, G, Rect, Circle } from "react-native-svg";

const SvgMaxBagIcon = (props) => (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none" {...props}>
        {/* Large suitcase/trolley icon */}
        <G>
            {/* Main body */}
            <Rect
                x={10}
                y={8}
                width={28}
                height={32}
                rx={4}
                fill="#6B5CE7"
                stroke="#5648C7"
                strokeWidth={1.5}
            />
            {/* Handle top */}
            <Path
                d="M20 8V4C20 2.9 20.9 2 22 2H26C27.1 2 28 2.9 28 4V8"
                stroke="#5648C7"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
            />
            {/* Front panel */}
            <Rect
                x={14}
                y={14}
                width={20}
                height={16}
                rx={2}
                fill="#7D70EE"
                stroke="#5648C7"
                strokeWidth={1}
            />
            {/* Horizontal straps */}
            <Path d="M10 20H38" stroke="#5648C7" strokeWidth={1.5} />
            <Path d="M10 28H38" stroke="#5648C7" strokeWidth={1.5} />
            {/* Lock */}
            <Rect x={22} y={32} width={4} height={4} rx={1} fill="#FFD700" stroke="#E6C200" strokeWidth={0.5} />
            {/* Wheels */}
            <Circle cx={16} cy={42} r={2} fill="#444" stroke="#333" strokeWidth={1} />
            <Circle cx={32} cy={42} r={2} fill="#444" stroke="#333" strokeWidth={1} />
            {/* Telescopic handle */}
            <Rect x={22} y={2} width={4} height={4} rx={1} fill="#888" stroke="#666" strokeWidth={0.5} />
        </G>
    </Svg>
);

export default SvgMaxBagIcon;
