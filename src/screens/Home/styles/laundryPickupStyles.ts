import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
    flexGrow: 1,
    marginHorizontal: 12,
    borderRadius: 16,
  },
  heading: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    marginBottom: 16,
    textAlign: "left",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: COLORS.LIGHT_GRAY_2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    position: "relative",
    minHeight: 80,
    overflow: "hidden",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONTFAMILY.INTER_BOLD,
    color: COLORS.BOTTOM_BLACK,
    textAlign: "left",
    maxWidth: "65%",
    paddingRight: 8,
    marginBottom: 8,
  },
  image: {
    width: 80,
    height: 80,
    position: "absolute",
    right: 0,
    bottom: 0,
  },
});