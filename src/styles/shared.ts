import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F9FF',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    color: '#1B2A4A',
    marginBottom: 6,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    color: '#7B869A',
    marginBottom: 18,
    fontFamily: 'Poppins-Regular',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  codeBox: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F1F6FF',
    borderRadius: 8,
    marginRight: 8,
  },
  codeText: { color: '#1B2A4A', fontFamily: 'Poppins-SemiBold' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    color: '#1B2A4A',
    fontFamily: 'Poppins-Regular',
  },
  forgot: {
    color: '#7B869A',
    textAlign: 'right',
    fontFamily: 'Poppins-Regular',
    marginRight: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
