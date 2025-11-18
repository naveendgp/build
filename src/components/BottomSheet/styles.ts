import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../../constants";

export default StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  sheet: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
    paddingTop: 2,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  scrollView: {
    // Remove flex: 1 to allow content-based sizing
  },
  scrollViewContent: {
 //   flexGrow: 0,
    paddingBottom: 0, // 16px margin below content
  },
  headerButton: {
    backgroundColor: COLORS.TEXT_PRIMARY,
    borderRadius: 28,
    width: 56,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 4 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 6 : undefined,
  },
  headerButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerIcon: {
    width: 15,
    height: 15,
    marginEnd: 10,
    tintColor: '#FFF',
  },
});
