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
  scrollContent: {
    padding: 16,
  },
  servicesContainer: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: COLORS.LIGHT_GRAY_2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectedServiceCard: {
    backgroundColor: COLORS.ONBOARDING_BG_LIGHT,
  },
  serviceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButtonContainer: {
    marginRight: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: COLORS.GREEN,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.GREEN,
  },
  serviceTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    flex: 1,
  },
  selectedServiceName: {
    color: COLORS.GREEN,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.GRAY,
  },
  serviceIllustration: {
    width: 80,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
});

