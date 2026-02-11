import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgBasketIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <Path
      stroke="#595959"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M37.405 39.378c-9.151.445-18.314.445-27.465 0M39.283 34.727c-10.402.575-20.82.575-31.222 0M40.288 30.117c-11.07.651-22.161.651-33.232 0M12.955 28.623l1.225 14.836M18.326 28.788l.61 14.781M23.672 28.848v14.721M29.017 28.802l-.609 14.767M34.385 28.651l-1.222 14.807M41.905 25.94q-17.869 1.18-35.81-.004a1.679 1.679 0 0 1 .22-3.348c11.783.778 23.588.778 35.371.001.916-.06 1.71.628 1.782 1.543v.003a1.68 1.68 0 0 1-1.563 1.806"
    />
    <Path
      stroke="#595959"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M6.829 28.295c.384 3.788 1.48 9.228 4.543 13.348a4.78 4.78 0 0 0 3.833 1.926H32.14c1.51 0 2.932-.714 3.833-1.926 3.047-4.1 4.148-9.505 4.537-13.29M39.86 22.704v-2.085c0-8.926-7.263-16.188-16.189-16.188S7.483 11.693 7.483 20.619v2.044"
    />
    <Path
      stroke="#595959"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M10 22.805v-2.187c0-7.539 6.133-13.672 13.672-13.672 7.538 0 13.672 6.133 13.672 13.672v2.222"
    />
  </Svg>
);
export default SvgBasketIcon;
