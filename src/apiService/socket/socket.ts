
import { API_ENDPOINTS, STRINGS } from '../../constants';
import { socketService } from './socketService';
import { useAuthStore } from '../store/useAuthStore';

const socket = new socketService({
  url: API_ENDPOINTS.SOCKET_BASE_URL,
  debug: false, // Socket logs disabled
  autoConnect: false,
  headers: async () => ({
    Authorization: `Bearer ${useAuthStore.getState().token}`,
  }),
  params: {
    target: 'vendor',
  },
});

export default socket;
