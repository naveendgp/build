import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const SvgExpressIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <Path
      stroke="#292929"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.622 3.36c.062-.496-.56-.766-.88-.383l-6.559 7.87a.5.5 0 0 0 .385.82h5.866a.5.5 0 0 1 .496.562l-.552 4.412c-.062.496.56.766.88.383l6.559-7.87a.5.5 0 0 0-.384-.82h-5.867a.5.5 0 0 1-.496-.562z"
    />
  </Svg>
);
export default SvgExpressIcon;
