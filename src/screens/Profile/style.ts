import { StatusBar, StyleSheet } from "react-native";
import { COLORS, FONTFAMILY } from "../../constants";

export default StyleSheet.create({
  root: {
    flex: 1,
    position: 'absolute', width: '100%', height: '100%'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginVertical: 24
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
  },
  bellBtn: {

    padding: 10,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 12
  },

  card: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    marginHorizontal: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.BLACK,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarInitials: {
    color: COLORS.NEUTRAL_WHITE,
    fontSize: 20,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
  },
  name: {
    fontSize: 16,
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
  },
  phone: {
    marginTop: 6,
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionLabel: {
    marginTop: 16,
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
  },
  sectionValue: {
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    marginTop: 6,
    fontSize: 12,
    fontWeight: '400',
  },
  editBtn: {
    marginTop: 16,
    borderColor: COLORS.THEME_GREEN,
    borderWidth: 1,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 10
  },
  editBtnText: {
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
    fontSize: 16
  },

  list: { marginTop: 16 },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,

    borderBottomColor: COLORS.BORDER_INPUT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

  },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listText: {
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontSize: 16,
    fontWeight: '500',
  },

  logoutRow: { paddingHorizontal: 16, paddingVertical: 16 },
  logoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutText: {
    color: COLORS.LOGOUT_TEXT,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontSize: 16,
    fontWeight: '500',
  },



});
