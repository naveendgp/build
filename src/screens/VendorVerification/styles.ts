import { StyleSheet } from 'react-native';
import shared from '../../styles/shared';

export default {
  ...shared,
  ...StyleSheet.create({
    stepIndicatorRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 40,
    },
    stepIndicator: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#ccc',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
    },
    stepIndicatorActive: {
      borderColor: '#007AFF',
      backgroundColor: '#E8F1FF',
    },
    stepIndicatorCompleted: {
      borderColor: '#34C759',
      backgroundColor: '#E8FFF3',
    },
    stepIndicatorText: { fontFamily: 'Poppins-Bold' },
    connector: {
      height: 2,
      flex: 1,
      backgroundColor: '#eee',
      marginHorizontal: 8,
    },
    connectorCompleted: {
      backgroundColor: '#34C759',
    },
  }),
};
