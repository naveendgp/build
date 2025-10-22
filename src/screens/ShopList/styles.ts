import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  categoryTabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
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
    backgroundColor: colors.lightGray,
  },
  selectedCategoryTab: {
    backgroundColor: colors.lightGreen,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedCategoryTabText: {
    color: colors.primary,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  totalItemsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  itemsList: {
    padding: 16,
    paddingBottom: 100, // Space for submit button
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
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
    color: colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  standardPrice: {
    fontSize: 14,
    color: colors.gray,
  },
  expressPrice: {
    fontSize: 14,
    color: colors.gray,
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
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  disabledQuantityButton: {
    color: colors.gray,
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
});

