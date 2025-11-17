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
  sectionTitle: {
    fontSize: 24,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.BLACK,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.INPUT_TEXT,
    marginBottom: 8,
  },
  asterisk: {
    color: COLORS.BLACK,
  },
  addressInputContainer: {
    marginTop: 0,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    borderRadius: 16,
    paddingHorizontal: 12,
     backgroundColor: COLORS.CARD_BACKGROUND,
    minHeight: 80,
  },
  addressInput: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.BLACK,
    textAlignVertical: 'top',
    minHeight: 40,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
     gap: 8,
  },
  locationButtonText: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.THEME_GREEN,
    fontWeight: '500',
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.INPUT_TEXT,
    marginBottom: 12,
  },
  uploadButton: {
     alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
    gap: 8,
    height:80
  },
  uploadText: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.INPUT_TEXT,
    fontWeight:'400'
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
  divider: {
    height: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    marginVertical: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    paddingHorizontal: 16,
   
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.INPUT_TEXT,
    flex: 1,
    marginRight: 12,
    fontWeight:'500'
  },
  repeatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  repeatLabel: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.INPUT_TEXT,
    fontWeight: '500',
  },
  repeatValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  repeatValue: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.INPUT_TEXT,
    fontWeight:'400'
  },
});

