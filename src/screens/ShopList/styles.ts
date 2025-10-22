import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {},
  categoryTabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: 8,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 24,
    paddingVertical: 6,
    marginHorizontal: 6,
    borderRadius: 30,
    backgroundColor: colors.lightGray,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryTabText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  selectedCategoryTabText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
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
    paddingBottom: 100,
  },

  // ---------- Improved Item Card Styles ----------
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
  },
  editablePriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  priceInputContainer: {
    flex: 1,
    minWidth: '30%',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  activeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },

  // ---------- Existing Styles ----------
  itemInfo: {
    flex: 1,
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

  // Others tab styles
  othersTabContainer: {
    flex: 1,
    padding: 16,
    minHeight: 200,
    backgroundColor: colors.background,
  },
  maxCountContainer: {
    marginTop: 20,
  },
  maxCountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  maxCountInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  maxCountDescription: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
