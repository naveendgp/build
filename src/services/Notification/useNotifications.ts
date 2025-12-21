import { useEffect } from 'react';
import { AppState } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { useAuthStore } from '../../apiService/store/useAuthStore';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { queryClient } from '../api/queryClient';
import { createAndroidChannels, playOrderNotification } from './NotificationHelper';
import socket from '../../apiService/socket/socket';
import { SOCKET_ENDPOINTS } from '../../constants';
import { fetchOrdersByStatus } from '../../apiService/api/ordersApi';
import { OrderStatusCode } from '../../apiService/types/ordersTypes';
import { useOrdersCountStore } from '../../apiService/store/useOrdersCountStore';
import { OrderStatus } from '../../types/order/order';

// 🪪 1️⃣ Request Firebase and Notifee permissions
async function requestPermissions() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission enabled');
    await getFcmToken();
  }

  await notifee.requestPermission();
  // Ensure all channels are created
  await createAndroidChannels();
}

// 🎯 2️⃣ Get FCM token
export const getFcmToken = async () => {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
      const { setFcmToken } = useAuthStore.getState();
      setFcmToken(fcmToken);
    }
  } catch (error) {
    console.log('Error getting FCM token:', error);
  }
};

// 🔔 3️⃣ Create or get Android channel based on title
async function getChannelIdForTitle(title: string) {
  let sound = 'default';
  let channelId = 'trip-updates-default';

  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('order')) {
    return 'orders_v3';
  }

  switch (title) {
    case 'Test':
      sound = 'sound1';
      channelId = 'trip-updates-sound1';
      break;
    case 'Test2':
      sound = 'sound2';
      channelId = 'trip-updates-sound2';
      break;
    case 'Test3':
      sound = 'sound3';
      channelId = 'trip-updates-sound3';
      break;
    default:
      sound = 'default';
      channelId = 'trip-updates-default';
  }

  // Create the channel if it doesn't exist
  await notifee.createChannel({
    id: channelId,
    name: `Trip Updates - ${title}`,
    importance: AndroidImportance.HIGH,
    sound, // matches res/raw/{sound}.mp3
  });

  return channelId;
}

// 🔊 4️⃣ Display notification
async function displayNotification(title: string, body: string, data?: any) {
  const channelId = await getChannelIdForTitle(title);

  await notifee.displayNotification({
    title,
    body,
    data, // Pass extra data like orderId
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      sound: channelId === 'orders_v3' ? 'order_alert' : undefined,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      visibility: 1, // Public
    },
  });
}

// 🎯 5️⃣ Hook implementation
export const useNotifications = () => {
  useEffect(() => {
    // Request permissions and setup channels
    requestPermissions();

    // 1. Listen for background/notification opened events
    // (Handled by handleNotificationNavigation via onForegroundEvent & getInitialNotification)

    // 2. Listen for Socket Events (Global Listener)
    const handleSocketOrder = async (data: any) => {
      console.log('🔥 [Socket] Order Event Received:', data);

      try {
        // User Requirement: Check if the order list size actually increased (new order)
        // or decreased/stayed same (cancellation/update). Only push if it's a new order.
        const response = await fetchOrdersByStatus({
          status: OrderStatusCode.RECEIVED,
          limit: 1,
        });

        if (response.status && response.data) {
          const newTotal = response.data.total;
          const { counts, setCount } = useOrdersCountStore.getState();
          const oldTotal = counts[OrderStatus.RECEIVED] || 0;

          console.log(`[Socket] RECEIVED Status - Old Count: ${oldTotal}, New Count: ${newTotal}`);

          if (newTotal > oldTotal) {
            console.log('[Socket] New order detected! Triggering push.');
            playOrderNotification(
              'New Order Received!',
              `Order #${data?.orderId || 'Incoming'} - New laundry request arrived.`
            );
          } else {
            console.log('[Socket] Order list size did not increase. Likely cancellation or repetitive event. Skipping push.');
          }

          // Update the global store count so the next comparison is accurate
          setCount(OrderStatus.RECEIVED, newTotal);
        }

        // Always invalidate queries to ensure any visible list (like ReceivedOrdersScreen) refreshes
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      } catch (error) {
        console.error('[Socket] Error checking order list size:', error);
      }
    };

    socket.on(SOCKET_ENDPOINTS.VENDOR_ORDER, handleSocketOrder);

    // 3. Listen for foreground FCM messages
    const unsubscribeFcm = messaging().onMessage(async remoteMessage => {
      const title = remoteMessage.notification?.title || 'Notification';
      const body = remoteMessage.notification?.body || '';
      console.log('FCM Foreground Message:', remoteMessage);


      //For Disable the Dialog
      if (title === 'Documents Approved') {
        try {
          await useProfileStore.getState().refreshProfile();
          await queryClient.refetchQueries({ queryKey: ['profile'] });

        } catch (err) {
          console.log('Failed to refresh profile after Documents Approved notification', err);
        }
      }

      await displayNotification(title, body, remoteMessage.data);
    });

    // 4. Handle Foreground notification press (Notifee)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('User pressed notification in foreground. Detail:', detail);
        handleNotificationNavigation(detail.notification, true);
      }
    });

    // 5. Check if app was opened from a quit state via a notification
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification) {
        console.log('App opened from quit state via notification', initialNotification.notification);
        handleNotificationNavigation(initialNotification.notification, false);
      }
    });

    return () => {
      socket.off(SOCKET_ENDPOINTS.VENDOR_ORDER, handleSocketOrder);
      unsubscribeFcm();
      unsubscribeNotifee();
    };
  }, []);
};

/**
 * Handle navigation based on notification content
 */
function handleNotificationNavigation(notification: any, cameFromForeground: boolean) {
  if (!notification) return;

  // User Request: If app is already OPEN in foreground, just clear (do nothing else)
  // If app is NOT active (background/killed), then open the app and navigate
  if (cameFromForeground && AppState.currentState === 'active') {
    console.log('[Notification] App already open and active. Skipping navigation.');
    return;
  }

  // Use a short timeout to ensure navigation container is ready
  setTimeout(() => {
    try {
      const authState = useAuthStore.getState();
      const navigation = authState.navigationRef?.current;

      if (!navigation) {
        console.log('[Notification] Navigation ref not ready yet');
        return;
      }

      // Check if user is logged in
      if (!authState.token || !authState.isLoggedIn) {
        console.log('[Notification] User not logged in, cannot navigate to Orders');
        return;
      }

      const title = (notification.title || '').toLowerCase();
      const body = (notification.body || '').toLowerCase();
      const data = notification.data || {};

      // Handle order related notifications (New, Received, Cancelled, etc.)
      if (title.includes('order') || body.includes('order') || data.orderId) {
        console.log('[Notification] Order related notification click. Title:', title);

        // Navigate to MainTabs and select Orders tab
        navigation.navigate('MainTabs', {
          screen: 'Orders',
          params: {
            initialTab: 'RECEIVED',
            refresh: true,
            timestamp: Date.now()
          }
        });
      }
    } catch (error) {
      console.error('[Notification] Error during notification navigation:', error);
    }
  }, 500);
}

// Background Event Handling (for when app is in background but not killed)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.PRESS) {
    console.log('User pressed notification in background', notification);
    // On background press, we don't have access to navigation directly here 
    // but Android will launch the activity due to launchActivity: 'default'
    // The foreground/initial notification handlers will then pick it up.
  }
});
