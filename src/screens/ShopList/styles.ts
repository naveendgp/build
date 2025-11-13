import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
  },
  categoryTabsContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY_2,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.LIGHT_GRAY_2,
  },
  selectedCategoryTab: {
    backgroundColor: COLORS.ONBOARDING_BG_LIGHT,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT,
  },
  selectedCategoryTabText: {
    color: COLORS.GREEN,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY_2,
  },
  totalItemsText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.GREEN,
  },
  itemsList: {
    padding: 16,
    paddingBottom: 100, // Space for submit button
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  standardPrice: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  expressPrice: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.LIGHT_GRAY_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.GREEN,
  },
  disabledQuantityButton: {
    color: COLORS.GRAY,
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY_2,
  },
});

