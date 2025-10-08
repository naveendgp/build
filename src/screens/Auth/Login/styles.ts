import { StyleSheet } from 'react-native';
import shared from '../../../styles/shared';

const local = StyleSheet.create({
  secondaryBtn: { alignItems: 'center' },
  secondaryText: {
    color: '#1B2A4A',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  socialBtn: {
    backgroundColor: '#F1F6FF',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  socialText: { fontSize: 18, color: '#1B2A4A', fontFamily: 'Poppins-Bold' },
});

export default { ...shared, ...local };
