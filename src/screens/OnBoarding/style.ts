import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    color: COLORS.WHITE

  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
  },
  skipText: {
    color: COLORS.ONBOARDING_BUTTON,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 24
  },
  slide: {
    width: width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  illustrationContainer: {
    width: '100%',
    height: height * 0.40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,


  },
  textContainer: {
    alignItems: 'center',

  },
  title: {
    fontSize: 22, //24 is to Big in Mobile
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16, //18 is to Big in Mobile
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: FONTFAMILY.INTER_REGULAR,

  },
  description: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 30,
    paddingTop: 20,
    width: '100%',
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50, // Ensures consistent height for centering
  },
  paginationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginRight: 4,
  },
  dotActive: {
    backgroundColor: COLORS.THEME_GREEN,
  },
  dotInactive: {
    backgroundColor: COLORS.ONBOARDING_DOT_INACTIVE,
  },
  nextButton: {
    backgroundColor: COLORS.ONBOARDING_BUTTON,
    paddingVertical: 12,
    paddingHorizontal: 35, //44 is to Merging with Dots
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
  },
});

export default styles;

