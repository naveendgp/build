import { StyleSheet, Dimensions, StatusBar } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";
const { width } = Dimensions.get("window");
export default StyleSheet.create({
  root: {
    position: 'absolute', flex: 1, width: '100%', height: '100%'
  },
  safe: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  gradientHeader: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
    color: COLORS.BOTTOM_BLACK,
    flex: 1,
    marginLeft: 10,
  },
  notificationButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderColor: COLORS.BORDER_INPUT,
    borderWidth: 1,

  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: COLORS.BLACK,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 32,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
    color: COLORS.NEUTRAL_WHITE,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.BOTTOM_BLACK,
    marginBottom: 8,
  },
  asterisk: {
    color: COLORS.RED,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    borderRadius: 8,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.BOTTOM_BLACK,
    padding: 0,
  }, inputRow: {
    width: width - 48,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    marginTop: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  addressContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    padding: 12,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addressLabel: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    color: COLORS.INPUT_TEXT,
    marginLeft: 8,
    lineHeight: 20,
  },
  addressPlaceholder: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.LOGIN_SUBTITLE,
    marginBottom: 12,
    fontWeight: '400',
  },
  addLocationButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  plusIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.ONBOARDING_BUTTON,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  plusText: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_BOLD,
    fontWeight: "700",
    color: COLORS.WHITE,
    lineHeight: 16,
  },
  addLocationText: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    color: COLORS.THEME_GREEN,
  },
  addressListCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    padding: 12,
    marginBottom: 12,
  },
  addressListText: {
    fontSize: 13,
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  addressActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  addressEdit: {
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  addressDelete: {
    color: COLORS.RED,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  continueButton: {
    backgroundColor: COLORS.ONBOARDING_BUTTON,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  continueText: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    color: COLORS.BOTTOM_BLACK,
    flex: 1,
  },

});

