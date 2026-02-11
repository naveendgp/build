import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, STRINGS } from '../../constants';
import { socketService } from './socketService';

const socket = new socketService({
  url: API_ENDPOINTS.SOCKET_BASE_URL,
  debug: true,
  autoConnect: false,
  transports: ['websocket', 'polling'], // Add polling as fallback for iOS
  headers: async () => ({
    Authorization: `Bearer ${await AsyncStorage.getItem(STRINGS.AUTH_TOKEN)}`,
  }),
  params: {
    target: 'user',
  },
});

export default socket;
