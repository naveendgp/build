import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute', width: '100%', height: '100%'

  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  vendorSection: {
    paddingHorizontal: 16
    // paddingBottom: 16,
  },
  vendorName: {
    fontSize: 36, //40 is too large for the screen
    fontWeight: '600',
    color: '#1D1D1D',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    color: "#049D03",
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '700',
    textAlign: 'center'
  },
  ratingCount: {
    fontSize: 12,
    color: '#8A8A8A',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555555',
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'column',
    marginTop: 16,
    gap: 12,

  },
  expressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
    backgroundColor: '#FFF3A1',
    alignSelf: 'flex-start',
  },
  expressText: {
    fontSize: 14,
    color: '#393939',
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#ECF0FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ADC3FE',
  },
  discountText: {
    fontSize: 14,
    color: '#1A73DA',
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    paddingRight: 60
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111111',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    paddingLeft: 16,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.THEME_GREEN,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.THEME_GREEN,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1D',
    fontFamily: 'Inter-SemiBold',
  },
  serviceIcon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    right: 0,
    bottom: 0,
  },
  reviewSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  ratingSummary: {
    marginBottom: 16,
  },
  largeRatingText: {
    fontSize: 24,
    color: COLORS.SUCCESS,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 12,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Inter-SemiBold',
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1D',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  reviewService: {
    fontSize: 16,
    color: '#595959',
    fontFamily: 'Inter-Regular',
    marginVertical: 12
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 16,
    color: COLORS.SUCCESS,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    color: '#555555',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    zIndex: 10,
  },
  proceedButton: {
    borderRadius: 16,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    backgroundColor: COLORS.THEME_GREEN,
  },
});

