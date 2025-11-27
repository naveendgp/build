import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingTop: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,

  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.THEME_GREEN,
    fontWeight: '500',
  },
  detailItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.NOTE_TEXT,
    fontWeight: '400',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.BOTTOM_BLACK,
    fontWeight: '500',
  },
  fileName: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.BLACK,
    marginTop: 4,
  },
  fileItem: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  previousButton: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.THEME_GREEN,
  },
  previousButtonText: {
    color: COLORS.THEME_GREEN,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.THEME_GREEN,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
});

