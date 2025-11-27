import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  card: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  inputContainer: {
    marginBottom: 16,
  },
  uploadSection: {
    marginTop: 8,
  },
  uploadLabel: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.INPUT_TEXT,
    marginBottom: 12,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.LOGIN_SUBTITLE,
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  uploadedFileName: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.BLACK,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  asterisk: {
    color: COLORS.ERROR,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.ERROR,
    marginTop: 4,
    marginLeft: 4,
  },
});

