import * as React from "react";
import Svg, { Path, Circle, G } from "react-native-svg";

const SvgRegularBagIcon = (props) => (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none" {...props}>
        {/* Small backpack icon */}
        <G>
            {/* Bag body */}
            <Path
                d="M14 18C14 16.9 14.9 16 16 16H32C33.1 16 34 16.9 34 18V38C34 39.1 33.1 40 32 40H16C14.9 40 14 39.1 14 38V18Z"
                fill="#4A90D9"
                stroke="#3A7BC8"
                strokeWidth={1.5}
            />
            {/* Top strap */}
            <Path
                d="M20 16V12C20 10.9 20.9 10 22 10H26C27.1 10 28 10.9 28 12V16"
                stroke="#3A7BC8"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
            />
            {/* Front pocket */}
            <Path
                d="M18 24H30V32C30 33.1 29.1 34 28 34H20C18.9 34 18 33.1 18 32V24Z"
                fill="#5BA0E9"
                stroke="#3A7BC8"
                strokeWidth={1}
            />
            {/* Zipper line */}
            <Path
                d="M22 28H26"
                stroke="#3A7BC8"
                strokeWidth={1.5}
                strokeLinecap="round"
            />
        </G>
    </Svg>
);

export default SvgRegularBagIcon;
