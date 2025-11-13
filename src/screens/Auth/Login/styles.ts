import { StyleSheet, Dimensions } from 'react-native';
import shared from '../../../styles/shared';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
const { width } = Dimensions.get("window");

export default StyleSheet.create({
  safe: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    alignItems: "flex-start",
    paddingTop: 100,
    paddingHorizontal: 12,
    position: 'absolute', width: '100%', height: '100%'
  },
  iconContainer: {
    backgroundColor: COLORS.ICON_GREEN,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  icon: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.BOTTOM_BLACK,
    textAlign: "left",
    width: "100%",
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.LOGIN_SUBTITLE,
    textAlign: "left",
    width: "100%",
    marginTop: 8,
  },
  profileInputContainer: {
    marginTop: 16,
    width: "100%",
  },
  continueButton: {
    backgroundColor: COLORS.ONBOARDING_BUTTON,
    width: width - 28,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 15,
    marginVertical: 12
  },
  continueText: {
    color: COLORS.BUTTON_BACKGROUND,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
    color: COLORS.LOGIN_SUBTITLE,
    textAlign: "left",
    lineHeight: 16, // 130% of 12px ≈ 15.6 -> 16
    width: "100%",
    marginTop: 6, // paragraph spacing
  },
  linkText: {
    fontSize: 12,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
    lineHeight: 16,
    color: "#0A8A1F",
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});
