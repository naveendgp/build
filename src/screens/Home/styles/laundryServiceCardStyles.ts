import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants';

export const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    gap: 5,
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subtitleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  timeIcon: {
    // SVG components handle their own styling
  },
  locationIcon: {
    // SVG components handle their own styling
  },
  separator: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_BOLD,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
  },
  rating: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 10,
  },
  servicesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 12,
  },
  serviceTag: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: 6,
    gap: 4,
    marginRight: 8,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    // marginBottom: 6,
  },
  serviceTagText: {
    fontSize: 13,
    color: "#000",
  },
  ratingText: {
    fontSize: 16,
    color: COLORS.SUCCESS,
    marginLeft: 4,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
  },
  card: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    marginBottom: 16,
    paddingTop: 12,
    elevation: 2,
    // marginHorizontal:12
  },
  expressTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 4,
    alignSelf: "flex-start",
    width: "60%",
    gap: 5,
    marginBottom: 8
  },
  expressText: {
    color: COLORS.EXPRESS_TEXT,
    fontWeight: "500",
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  serviceButton: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
    borderColor: COLORS.BORDER,
    borderWidth: 1,
  },
  serviceText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,

  },
  priceContainer: {
    flexDirection: "column",
  },
  startsAtText: {
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
    fontSize: 12,
    letterSpacing: 0,
    color: COLORS.TEXT_SECONDARY,
  },
  priceAmountText: {
    fontFamily: FONTFAMILY.INTER_BOLD,
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: 0,
    color: COLORS.TEXT_SECONDARY,
  },
  arrowButton: {
    backgroundColor: COLORS.THEME_GREEN,
    borderRadius: 16,
    paddingHorizontal: 28,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  discountBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.LIGHT_GRAY_2,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  discountText: {
    color: COLORS.DISCOUNT_TEXT,
    fontWeight: "600",
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontSize: 12,
  },
});