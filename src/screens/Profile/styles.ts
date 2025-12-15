import { StatusBar, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    marginTop: 2,
    marginBottom: 16,
  },
  summaryStats: {
    gap: 16,
    justifyContent: 'space-between',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B2A4A',
    marginBottom: 16,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },


  // Switch Row Styles
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchLabel: {
    fontSize: 16,
    color: '#1B2A4A',
    flex: 1,
  },

  // Status Card Styles
  statusCard: {
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
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    color: '#1B2A4A',
  },

  // Hours Card Styles
  hoursCard: {
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
  hoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2A4A',
    marginBottom: 8,
  },
  hoursText: {
    fontSize: 14,
    color: '#7B869A',
    marginBottom: 4,
  },

  // Stats Card Styles
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
    elevation: 3,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.NOTE_TEXT,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },

  // Balance Card Styles
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#7B869A',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B2A4A',
    marginBottom: 4,
  },
  balanceCurrency: {
    fontSize: 14,
    color: '#7B869A',
  },

  // Actions Container
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  // Transaction Card Styles
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1B2A4A',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#7B869A',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    color: '#7B869A',
  },

  // Profile Options Styles
  optionsContainer: {

    marginHorizontal: 12,
    marginBottom: 20,

  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 4
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  logoutOptionItem: {
    paddingTop: 16,
  },
  logoutOptionTitle: {
    color: COLORS.LOGOUT_TEXT,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#7B869A',
    marginTop: 12,
  },

  // Day Card Styles
  dayCard: {
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
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2A4A',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#F6F9FF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeLabel: {
    fontSize: 12,
    color: '#7B869A',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2A4A',
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B869A',
    marginHorizontal: 16,
  },
  closedText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B2A4A',
    textAlign: 'center',
    marginBottom: 20,
  },
  timePickerContainer: {
    height: 300,
    marginBottom: 20,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeOption: {
    flex: 1,
    backgroundColor: '#F6F9FF',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 40,
    justifyContent: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#1B2A4A',
    borderColor: '#1B2A4A',
  },
  timeOptionText: {
    fontSize: 12,
    color: '#1B2A4A',
    fontWeight: '500',
  },
  selectedTimeOptionText: {
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#1B2A4A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bank Details Styles
  bankDetailsCard: {
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
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bankDetailLabel: {
    fontSize: 14,
    color: '#7B869A',
    fontWeight: '500',
    flex: 1,
  },
  bankDetailValue: {
    fontSize: 14,
    color: '#1B2A4A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  // Editable Bank Details Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    fontSize: 16,
    color: '#1B2A4A',
    fontWeight: '600',
  },
  bankDetailsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  // Review Section Styles
  reviewSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  reviewSectionEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  sectionTitle1: {
    fontSize: 20,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '700',
    color: COLORS.BOTTOM_BLACK,
    marginBottom: 16,
  },
  sectionTitle2: {
    fontSize: 24,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  // Rating Summary Styles
  ratingSummary: {
    marginBottom: 16,
  },
  largeRatingText: {
    fontSize: 24,
    color: COLORS.SUCCESS,
    fontFamily: FONTFAMILY.INTER_BOLD,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  ratingCount: {
    fontSize: 12,
    color: '#8A8A8A',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },
  // Review Card Styles
  reviewCard: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    padding: 16,

    marginBottom: 12,
    marginHorizontal: 12
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewerInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatar2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A2A2A2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText2: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_MEDIUM,

  },
  reviewDate: {
    fontSize: 12,
    color: '#8A8A8A',

    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '400',
  },
  reviewService: {
    fontSize: 16,
    color: '#595959',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    marginVertical: 12,
    fontWeight: '400',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 16,
    color: COLORS.SUCCESS,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },
  reviewText: {
    fontSize: 14,
    color: '#595959',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
    lineHeight: 14 * 1.42,
  },
});
