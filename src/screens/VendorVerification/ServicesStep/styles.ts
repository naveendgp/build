import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

export default StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 12,
  },
  servicesList: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    padding: 16,
    gap: 12,
  },
  serviceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderWidth: 0.5,
    borderColor: COLORS.BORDER_INPUT,
  },
  serviceOptionCardSelected: {
    backgroundColor: COLORS.ICON_GREEN,
    borderColor: COLORS.THEME_GREEN,
  },
  serviceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  serviceOptionName: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.BOTTOM_BLACK,
    fontWeight: '500',
  },
  serviceOptionNameSelected: {
    color: COLORS.THEME_GREEN,
  },
  serviceOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceImage: {
    width: 100,
    height: 70,
    bottom: 0,
  },
  serviceImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  serviceCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCheckboxSelected: {
    backgroundColor: COLORS.THEME_GREEN,
    borderColor: COLORS.THEME_GREEN,
  },
  serviceNote: {
    marginTop: 24,
    fontSize: 14,
    color: COLORS.NOTE_TEXT,
    textAlign: 'left',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.ERROR,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
});

