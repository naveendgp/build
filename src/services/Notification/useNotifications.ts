import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useAuthStore } from '../../apiService/store/useAuthStore';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { queryClient } from '../api/queryClient';

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
async function displayNotification(title: string, body: string) {
  const channelId = await getChannelIdForTitle(title);

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
    },
  });
}

// 🎯 5️⃣ Hook implementation
export const useNotifications = () => {
  useEffect(() => {
    // Request permissions
    requestPermissions();

    // Listen for foreground FCM messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const title = remoteMessage.notification?.title || 'Notification';
      const body = remoteMessage.notification?.body || '';

      console.log('Title:', title);
      console.log('Body:', body);

      // Refresh profile when documents are approved
      if (title === 'Documents Approved') {
        try {
          await useProfileStore.getState().refreshProfile();
          await queryClient.refetchQueries({ queryKey: ['profile'] });

        } catch (err) {
          console.log('Failed to refresh profile after Documents Approved notification', err);
        }
      }

      await displayNotification(title, body);
    });

    return unsubscribe;
  }, []);
};
