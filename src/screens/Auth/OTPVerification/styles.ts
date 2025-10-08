import { StyleSheet } from 'react-native';
import shared from '../../../styles/shared';

const local = StyleSheet.create({
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    textAlign: 'center',
    fontSize: 20,
    color: '#1B2A4A',
    backgroundColor: '#F9FBFF',
    fontFamily: 'Poppins-Medium',
  },
  primaryBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontFamily: 'Poppins-Bold' },
  or: { textAlign: 'center', marginTop: 18, color: '#9AA0A6', fontFamily: 'Poppins-Regular' },
});

export default { ...shared, ...local };
