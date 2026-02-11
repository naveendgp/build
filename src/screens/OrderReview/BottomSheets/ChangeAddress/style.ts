import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../../constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    color: COLORS.THEME_GREEN,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    flex: 1,
    position: 'absolute',
    bottom: -16,
  },
  loadingContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
});

