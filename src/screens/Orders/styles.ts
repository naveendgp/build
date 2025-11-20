import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 24,
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B2A4A',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7B869A',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    backgroundColor: COLORS.WHITE,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 18,
    color: COLORS.INPUT_TEXT,
    fontWeight: '400',
    alignContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    lineHeight: 18 * (120 / 100),
    marginRight: 10,
  },
  tabTextActive: {
    color: COLORS.INPUT_TEXT,
    fontWeight: '800',
    lineHeight: 18 * (120 / 100),
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: -5,
    right: -3,
    alignContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    alignSelf: 'center',
    height: 2,
    gap: 6,
    backgroundColor: COLORS.INPUT_TEXT,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 32,
    backgroundColor: COLORS.INPUT_TEXT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    lineHeight: 12 * (120 / 100),
    color: COLORS.BUTTON_BACKGROUND,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B2A4A',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#7B869A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsText: {
    fontSize: 14,
    color: '#7B869A',
    flex: 1,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B2A4A',
  },

});
