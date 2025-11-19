import { StyleSheet, Dimensions } from 'react-native';
import shared from '../../../styles/shared';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

const { width } = Dimensions.get('window');

const local = StyleSheet.create({
  mainSection: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 12,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  iconBox: {
    backgroundColor: COLORS.ICON_GREEN,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.BOTTOM_BLACK,
    textAlign: 'left',
    width: '100%',
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitleContainer: {
    width: '100%',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.LOGIN_SUBTITLE,
    textAlign: 'left',
    width: '100%',
  },
  phoneNumber: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.BOTTOM_BLACK,
    textAlign: 'left',
    width: '100%',
    marginTop: 4,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 24,
    width: '100%',
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    textAlign: 'center',
    fontSize: 20,
    color: '#1B2A4A',
    backgroundColor: '#F9FBFF',
    fontFamily: 'Poppins-Medium',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.LOGIN_SUBTITLE,
  },
  resendText: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.GREEN,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: COLORS.ONBOARDING_BUTTON,
    width: width - 28,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 15,
    marginVertical: 12,
  },
  continueText: {
    color: COLORS.BUTTON_BACKGROUND,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontFamily: 'Poppins-Bold' },
  or: {
    textAlign: 'center',
    marginTop: 18,
    color: '#9AA0A6',
    fontFamily: 'Poppins-Regular',
  },
});

export default { ...shared, ...local };
