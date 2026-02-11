import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { theme } from '../../utils';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY_2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  readContainer: {
    backgroundColor: COLORS.LIGHT_GRAY_3,
    borderColor: COLORS.LIGHT_GRAY,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    color: COLORS.DARK_GRAY,
    flex: 1,
    marginRight: 8,
    fontFamily: theme.typography.fontFamily.SEMIBOLD,
  },
  readTitle: {
    color: COLORS.GRAY,
    fontFamily: theme.typography.fontFamily.REGULAR,
  },
  time: {
    fontSize: theme.typography.fontSize.xs,
    color: COLORS.GRAY,
    textAlign: 'right',
    minWidth: 100,
    fontFamily: theme.typography.fontFamily.REGULAR,
  },
  message: {
    fontSize: theme.typography.fontSize.sm,
    color: COLORS.GRAY,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily.REGULAR,
  },
  readMessage: {
    color: COLORS.GRAY,
  },
});

export default styles;