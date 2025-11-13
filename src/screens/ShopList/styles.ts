import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {},
  categoryTabsContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY_2,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
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
    fontSize: 18,
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

  // Others tab styles
  othersTabContainer: {
    flex: 1,
    padding: 16,
    minHeight: 200,
    backgroundColor: COLORS.BACKGROUND,
  },
  maxCountContainer: {
    marginTop: 20,
  },
  maxCountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  maxCountInput: {
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.TEXT,
    backgroundColor: COLORS.WHITE,
  },
  maxCountDescription: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
