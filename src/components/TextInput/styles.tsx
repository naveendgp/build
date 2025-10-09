import { StyleSheet } from 'react-native';

// Explicit colors and fonts (use direct values instead of theme/constants)
export default StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    borderBottomWidth: 0,
    borderBottomColor: '#aaa',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    fontWeight: '400',
    paddingVertical: 12,
    color: '#1B2A4A',
  },
  placeholderTextColor: {
    color: '#9AA0A6',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
    color: '#1B2A4A',
    marginVertical: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
  },
});
