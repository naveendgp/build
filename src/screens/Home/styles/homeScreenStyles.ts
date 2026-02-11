import { StyleSheet, StatusBar, Dimensions, useWindowDimensions } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants';
import { theme } from '../../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute', width: '100%', height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  banner: {
    backgroundColor: theme.colors.primary,
    margin: 15,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  bannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  bannerEmoji: {
    fontSize: 40,
  },
  section: {
    paddingHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  seeAllText: {
    fontSize: 16,
    color: COLORS.THEME_GREEN,
    fontWeight: "600",
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    textAlign: "right",
  },
  cardsContainer: {
    gap: theme.spacing.sm,
    marginHorizontal: 12,
  },
  serviceCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.subtle,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  discountBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: COLORS.DISCOUNT_BADGE,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  discountText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  serviceName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  ratingContainer: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  ratingText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  cardDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.xs,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.subtle,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bookButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  bookButtonText: {
    fontSize: 20,
  },
  bottomPadding: {
    height: 0, // Add padding to account for tab bar height
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  retryButton: {
    backgroundColor: COLORS.THEME_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
  },
  // Additional styles for inline elements
  lifeMadeEasierText: {
    fontSize: 40,
    marginHorizontal: 16,
    marginVertical: 40,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
    color: COLORS.TEXT_MUTED,
    fontStyle: "italic",
  },
  // Banner carousel styles
  bannerContainer: {
    marginVertical: 24,
    // marginHorizontal: 12,
    alignItems: 'center',
  },
  bannerFlatList: {
    height: 140,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 4,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginHorizontal: 2,
  },
  paginationDotActive: {
    backgroundColor: COLORS.THEME_GREEN,
  },
  bannerItemContainer: {
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: Dimensions.get('window').width * 0.94,
    height: 140,
    borderRadius: 12,
  },
  // Skeleton styles for LaundryPickupComponent
  skeletonPickupContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.CARD_BACKGROUND,
    marginHorizontal: 12,
    borderRadius: 16,
    paddingBottom: 16,
  },
  skeletonPickupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  skeletonPickupCard: {
    width: "48%",
    marginBottom: 16,
  },
  // Skeleton styles for Vendor Cards
  skeletonVendorCard: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    marginBottom: 16,
    paddingTop: 12,
    elevation: 2,
  },
  skeletonVendorContent: {
    paddingHorizontal: 12,
  },
  skeletonVendorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  skeletonVendorTextContainer: {
    flex: 1,
    gap: 8,
  },
  skeletonVendorSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  skeletonVendorServicesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 12,
    gap: 8,
  },
  skeletonVendorFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1D1D1",
  },
});