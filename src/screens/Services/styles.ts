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
  scrollContent: {
    padding: 16,
  },
  servicesContainer: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectedServiceCard: {
    backgroundColor: colors.lightGreen,
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
    borderColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  serviceTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  selectedServiceName: {
    color: colors.primary,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: colors.gray,
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

