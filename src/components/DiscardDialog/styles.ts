import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants/colors';

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  closeBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 10,
    padding: 6,
  },
  closeText: {
    fontSize: 24,
    lineHeight: 24,
    color: COLORS.BOTTOM_BLACK,
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 0,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '700',
    color: COLORS.BOTTOM_BLACK,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
    color: COLORS.NOTE_TEXT,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.ONBOARDING_BUTTON,
  },
  primaryButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
});
