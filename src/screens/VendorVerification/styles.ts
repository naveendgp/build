import { StyleSheet } from 'react-native';
import shared from '../../styles/shared';

export default {
  ...shared,
  ...StyleSheet.create({
    connectorCompleted: {
      backgroundColor: '#34C759',
    },
    stepIndicatorRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: 16,
      marginHorizontal: 20,
    },
    stepIndicator: {
      width: 20,
      height: 20,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#ccc',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
    },
    stepIndicatorActive: {
      borderColor: '#000000',
      backgroundColor: '#E8F1FF',
      width: 30,
      height: 30,
      borderRadius: 20,
    },
    stepIndicatorCompleted: {
      borderColor: '#0000004d',
      backgroundColor: '#0000004d',
    },
    stepIndicatorText: { fontFamily: 'Poppins-Bold' },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#000',
    },
    connector: {
      height: 2,
      flex: 1,
      backgroundColor: '#E0E0E0',
      alignSelf: 'center',
      marginHorizontal: 8,
    },
  }),
};
