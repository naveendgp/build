import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16, marginHorizontal: 12
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
  serviceInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 8
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
  serviceOptionDescription: {
    fontSize: 13,
    color: COLORS.LOGIN_SUBTITLE,
    marginTop: 4,
  },
  serviceOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceImage: {
    width: 100,
    height: 70,
    bottom: 0
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
    marginTop: 16,
    marginBottom: 24,
    fontSize: 14,
    color: COLORS.NOTE_TEXT,
    textAlign: 'left',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.BOTTOM_BLACK,
    fontWeight: '700',
    marginBottom: 16,
  },
  serviceNameContainer: {

  },
  underVerificationText: {
    fontSize: 12,
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    marginTop: 2,
    paddingLeft: 12
  },
  serviceCheckboxUnverified: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.BORDER_INPUT,
  },
  minusIcon: {
    fontSize: 20,
    color: COLORS.NOTE_TEXT,
    fontWeight: '400',
    lineHeight: 20,
  },
  updateButtonContainer: {
    paddingHorizontal: 12,
    paddingTop: 16,
    backgroundColor: COLORS.WHITE,
  },
  updateButton: {
    backgroundColor: COLORS.THEME_GREEN,
    borderRadius: 8,
    paddingVertical: 16,
  },
  selectedItemsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_INPUT,
  },
  selectedItemsText: {
    fontSize: 14,
    color: COLORS.NOTE_TEXT,
    textAlign: 'center',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '600',
    color: COLORS.BOTTOM_BLACK,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.LOGIN_SUBTITLE,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.THEME_GREEN,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    textAlign: 'center',
  },
});

