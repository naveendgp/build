import { COLORS } from "../../constants";
import CustomToast from "./CustomToast";



export const showToast = (msg: string) => {
    CustomToast.show({
        msg,
        bgColor: COLORS.ACCENT,
        textColor: COLORS.WHITE,
    });
};

export const showErrorToast = (msg: string) => {
    CustomToast.show({
        msg,
        bgColor: COLORS.ERROR_TOAST,
        textColor: COLORS.WHITE,
    });
};

export const showSuccessToast = (msg: string) => {
    CustomToast.show({
        msg,
        bgColor: COLORS.ACCENT,
        textColor: COLORS.WHITE,
    });
};
