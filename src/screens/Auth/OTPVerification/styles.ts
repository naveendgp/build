import { StyleSheet, Dimensions } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";

const { width } = Dimensions.get("window");

export default StyleSheet.create({
  safe: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    alignItems: "flex-start",
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  iconBox: {
    backgroundColor: COLORS.ICON_GREEN,
    borderRadius: 12,
    padding: 12,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain"
  },
  mainSection: {
    width: "100%",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingTop: 150,

    position: 'absolute', flex: 1, height: '100%'
  },
  title: {
    fontSize: 24,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.BOTTOM_BLACK,
    textAlign: "left",
    width: "100%",
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8
  },
  subtitleContainer: {

    width: "100%",
  },
  subtitle: {
    textAlign: "left",
    color: COLORS.LOGIN_SUBTITLE,
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
    lineHeight: 18, // 130% of 14px
    width: "100%",
    marginBottom: 6, // paragraph spacing
  },
  phoneNumber: {
    textAlign: "left",
    color: COLORS.LOGIN_SUBTITLE,
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '600',
    lineHeight: 18, // 130% of 14px
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginVertical: 16,
    width: "100%",
  },
  otpBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    textAlign: "center",
    fontSize: 20,
    color: COLORS.BOTTOM_BLACK,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerText: {
    fontSize: 14,
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '600',
    marginLeft: 6,
  },
  resendText: {
    fontSize: 16,
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '600',

  },
  submitBtn: {
    backgroundColor: COLORS.ONBOARDING_BUTTON,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    width: width - 24,
    marginBottom: 20,
  },
  continueText: {
    color: COLORS.BUTTON_BACKGROUND,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
});
