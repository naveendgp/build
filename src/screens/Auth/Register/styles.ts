import { StyleSheet } from 'react-native';
import shared from '../../../styles/shared';

const local = StyleSheet.create({
  secondaryBtn: { alignItems: 'center' },
  secondaryText: { color: '#1B2A4A', fontFamily: 'Poppins-SemiBold' },
  uploadBtn: {
    borderWidth: 1,
    borderColor: '#E6EEF8',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FBFF',
  },
  uploadText: { color: '#1B2A4A', fontFamily: 'Poppins-SemiBold' },
});

export default { ...shared, ...local };
