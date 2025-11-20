import { Platform, StyleSheet } from "react-native";
import { COLORS, FONTFAMILY } from "../../constants";


const THUMB_SIZE = 48;
const SLIDER_HEIGHT = 48;
const SLIDER_PADDING = 4;
const TOUCH_PADDING = 12;
const SLIDER_WIDTH = 235;
const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 32;

export default StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  measureContainer: {
    width: '100%',
  },

  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    zIndex: 2,
    paddingHorizontal: 29,
  },
  sliderText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  disabledText: {
    fontSize: 16,
    marginRight: 28,
    color: COLORS.WHITE,
  },
  thumbTouchWrapper: {
    position: 'absolute',
    left: 0,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    marginLeft: 10,
    marginRight: 10,
    right: 0,
    //height: THUMB_HEIGHT + TOUCH_PADDING * 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  slider: {
    // width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    borderRadius: 16,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.THEME_GREEN,
    // paddingHorizontal: 16,
    ...Platform.select({
      android: { elevation: 0.2 },
    }),
  },

  thumb: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    backgroundColor: COLORS.WHITE,
    // marginLeft: 0 by default (remove the 10px you added earlier)
  },

});