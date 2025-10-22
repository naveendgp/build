import CustomToast from '../components/CustomToast';
import { colors } from '../constants';

export const showToast = (msg: string) => {
  CustomToast.show({
    msg,
    bgColor: colors.primary,
    textColor: colors.white,
  });
};

export const showErrorToast = (msg: string) => {
  CustomToast.show({
    msg,
    bgColor: colors.error,
    textColor: colors.white,
  });
};

export const showSuccessToast = (msg: string) => {
  CustomToast.show({
    msg,
    bgColor: colors.success,
    textColor: colors.white,
  });
};
