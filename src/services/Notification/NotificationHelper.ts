// src/services/LocalNotificationService.ts
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { PermissionsAndroid, Platform } from 'react-native';

export async function displayNotification(title: string, body: string) {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'default',
      smallIcon: 'ic_launcher', // make sure you have this icon in res/mipmap
      importance: AndroidImportance.HIGH,
    },
  });
}

// Call this once on app start to create Android channels
export async function createAndroidChannels() {
  console.log('[NotificationHelper] Creating Android channels...');

  // Default channel
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  // Order alert channel with custom sound
  const orderChannelId = await notifee.createChannel({
    id: 'orders_v3',
    name: 'New Order Alerts',
    importance: AndroidImportance.HIGH,
    sound: 'order_alert',
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: true, // Allow sound even in DND if user allows
  });

  console.log('[NotificationHelper] Order channel created:', orderChannelId);

  // Silent order channel for rapid updates
  await notifee.createChannel({
    id: 'orders_silent_v2',
    name: 'New Order Alerts (Silent)',
    importance: AndroidImportance.LOW, // Low importance = no sound/interruption
    visibility: AndroidVisibility.PUBLIC,
  });
}

let lastNotificationTime = 0;
const SOUND_COOLDOWN = 5000; // 5 seconds cooldown

export async function playOrderNotification(title: string, body: string) {
  const currentTime = Date.now();

  // If multiple orders come within the cooldown period, we show a silent notification
  // to avoid overlapping audio (music overlap issue)
  const shouldPlayWithSound = (currentTime - lastNotificationTime) > SOUND_COOLDOWN;
  const channelId = shouldPlayWithSound ? 'orders_v3' : 'orders_silent_v2';

  console.log(`[Notification] Triggering notification on channel: ${channelId} (sound: ${shouldPlayWithSound})`);

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      importance: shouldPlayWithSound ? AndroidImportance.HIGH : AndroidImportance.LOW,
      // explicit sound if needed, but channel handles it
      sound: shouldPlayWithSound ? 'order_alert' : undefined,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      // Ensure it shows even on lock screen etc.
      visibility: AndroidVisibility.PUBLIC,
    },
  });

  if (shouldPlayWithSound) {
    lastNotificationTime = currentTime;
  }
}

export const requestAndroidNotificationsPermission = async () => {
  if (Platform.OS !== 'android') return;

  const version =
    typeof Platform.Version === 'string'
      ? parseInt(Platform.Version, 10)
      : Number(Platform.Version || 0);

  if (version >= 33) {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied:', result);
      }
    } catch (err) {
      console.warn('Failed to request notification permission', err);
    }
  }
};
