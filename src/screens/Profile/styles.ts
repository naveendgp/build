import { StatusBar, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#1B2A4A',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_BOLD,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    marginBottom: 12,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_BOLD,
    marginBottom: 20,
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

  // Profile Card Styles
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
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
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B2A4A',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B2A4A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#7B869A',
    marginBottom: 8,
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

  // Service Card Styles
  serviceCard: {
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
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2A4A',
  },
  pricingType: {
    fontSize: 12,
    color: '#7B869A',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#7B869A',
    marginBottom: 12,
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B2A4A',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#7B869A',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B2A4A',
  },
  moreItems: {
    fontSize: 12,
    color: '#7B869A',
    fontStyle: 'italic',
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
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
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_INPUT,
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
    color: '#FF3B30',
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
  subtitle: {
    fontSize: 14,
    color: '#7B869A',
    marginTop: 4,
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
});
