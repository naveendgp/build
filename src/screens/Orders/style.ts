import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import { FONTFAMILY } from "../../constants/fonts";

export default StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute', width: '100%', height: '100%'

  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  notificationButton: {
    padding: 4,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BLACK,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 20,

  },
  section: {
    marginBottom: 16,

  },
  sectionTitle: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_BOLD,
    marginBottom: 4,
    marginTop: 12,
    // paddingHorizontal: 4,
    fontWeight: "600",
    marginHorizontal: 12
  }, headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    // paddingTop: 12,
    // paddingBottom: 8,
    // marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    paddingVertical: 9,
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
});