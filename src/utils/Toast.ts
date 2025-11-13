import CustomToast from '../components/CustomToast';
import { COLORS } from '../constants';

export const showToast = (msg: string) => {
  CustomToast.show({
    msg,
    bgColor: COLORS.PRIMARY,
    textColor: COLORS.WHITE,
  });
};

export const showErrorToast = (msg: string) => {
  CustomToast.show({
    msg,
    bgColor: COLORS.ERROR,
    textColor: COLORS.WHITE,
  });
};

export const showSuccessToast = (msg: string) => {
  CustomToast.show({
    msg,
    bgColor: COLORS.SUCCESS,
    textColor: COLORS.WHITE,
  });
};
