import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.SECONDARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.NOTE_TEXT,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#7B869A',
    fontWeight: '500',
  },
});

export default styles;

