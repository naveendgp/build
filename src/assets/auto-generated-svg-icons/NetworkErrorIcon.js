import * as React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
const SvgNetworkErrorIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={150}
    height={150}
    fill="none"
    {...props}
  >
    <Rect width={150} height={150} fill="#F6F6F6" rx={75} />
    <Circle cx={75} cy={75} r={57.857} fill="#D9D9D9" opacity={0.3} />
    <Path
      stroke="#1D1D1D"
      strokeMiterlimit={10}
      d="M92.128 66.172a19.2 19.2 0 0 1 2.129 8.813c0 10.056-7.704 18.314-17.532 19.194h-3.627"
    />
    <Path
      stroke="#1D1D1D"
      strokeMiterlimit={10}
      d="M73.22 94.176c-9.816-.891-17.506-9.143-17.506-19.192 0-10.643 8.628-19.271 19.271-19.271 3.19 0 6.2.775 8.85 2.147"
    />
    <Path
      stroke="#1D1D1D"
      strokeMiterlimit={10}
      d="M91.294 56.478a5.898 5.898 0 1 0 1.052.761M74.956 83.37a1.398 1.398 0 1 0 0-2.796 1.398 1.398 0 0 0 0 2.796Z"
    />
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeMiterlimit={10}
      d="m63.657 71.549.426-.45a15.33 15.33 0 0 1 10.873-4.503 15.33 15.33 0 0 1 10.929 4.559l.43.472"
    />
    <Path
      stroke="#1D1D1D"
      strokeMiterlimit={10}
      d="M74.957 74.982a6.96 6.96 0 0 0-3.936 1.213c-.632.43-.621 1.32-.08 1.86.55.552 1.442.517 2.139.168a4.2 4.2 0 0 1 1.877-.443c.677 0 1.317.16 1.883.446.696.35 1.59.386 2.14-.166.541-.54.552-1.428-.078-1.86a6.96 6.96 0 0 0-3.945-1.218ZM70.768 73.121a9.8 9.8 0 0 0-1.734 1.055c-.62.472-1.51.482-2.058-.072-.537-.544-.541-1.426.052-1.908a12.54 12.54 0 0 1 7.928-2.81c3.005 0 5.764 1.054 7.928 2.81.596.485.59 1.371.046 1.914-.548.549-1.434.536-2.051.066a9.75 9.75 0 0 0-5.923-1.993c-.997-.025-1.999.167-2.95.471"
    />
    <Path
      stroke="#1D1D1D"
      strokeLinecap="round"
      strokeMiterlimit={10}
      d="m90.538 59.463-4.3 4.3M90.538 63.763l-4.3-4.3"
    />
  </Svg>
);
export default SvgNetworkErrorIcon;
