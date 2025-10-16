import { StyleSheet } from 'react-native';
import shared from '../../styles/shared';

export default {
  ...shared,
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F6F9FF',
    },
    // any home specific styles can go here
  }),
};
