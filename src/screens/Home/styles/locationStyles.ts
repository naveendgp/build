import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // borderRadius: 10,
    marginHorizontal: 12,
    marginVertical: 24,
  },
  locationInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
    marginLeft: 3,
    color: COLORS.location_text,
  },
  subText: {
    color: COLORS.TEXT_GRAY,
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    marginLeft: 5,
    fontWeight: "400",
    maxWidth: '80%',
    overflow: 'hidden',
  },
  icons: {
    flexDirection: "row",
  },
  iconContainer: {
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cartIcon: {
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
});