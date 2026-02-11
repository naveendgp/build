import { theme } from '../../utils/theme';
import {StyleSheet} from 'react-native';
import { COLORS } from '../../constants/colors';
const { fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, fontWeight: FONT_WEIGHT } = theme.typography;

export default StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderBottomWidth: 0,
    borderBottomColor: '#aaa',
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.REGULAR,
    fontWeight: FONT_WEIGHT.normal,
    paddingVertical: 10,
    color: COLORS.BLACK,
  },
  placeholderTextColor: {
    color: COLORS.GRAY4,
  },
  labelText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    fontFamily: FONT_FAMILY.MEDIUM,
    color: COLORS.GRAY,
    marginVertical: 4,
  },
  errorText: {
    color: COLORS.RED,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.REGULAR,
    marginBottom: 8,
  },
});
