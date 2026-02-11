// src/services/LocalNotificationService.ts
import notifee, { AndroidImportance } from '@notifee/react-native';
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

// Call this once on app start to create Android channel
export async function createAndroidChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
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
