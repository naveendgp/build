import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../../constants";


const THUMB_SIZE = 48;
const SLIDER_HEIGHT = THUMB_SIZE + 8;
const SLIDER_PADDING = 4;
const THUMB_WIDTH = 60;
const TOUCH_PADDING = 12;

export default StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  measureContainer: {
    width: '100%',
  },
  slider: {
    width: '100%',
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_HEIGHT / 2,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.LIGHT_GRAY_2,
    paddingHorizontal: SLIDER_PADDING,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 0.2 },
    }),
  },
  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingHorizontal: 20,
  },
  sliderText: {
    color: COLORS.BLACK,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: COLORS.LIGHT_GRAY,
  },
  thumbTouchWrapper: {
    position: 'absolute',
    left: 0,
    width: THUMB_WIDTH + TOUCH_PADDING * 2,
    height: THUMB_WIDTH + TOUCH_PADDING * 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
});