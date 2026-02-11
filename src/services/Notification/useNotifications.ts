import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, IOSAuthorizationStatus } from '@notifee/react-native';
import { STRINGS } from '../../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeEventEmitter, NativeModules } from 'react-native';

// 🪪 1️⃣ Request Firebase and Notifee permissions
async function requestPermissions() {
  try {
    // ✅ Request Firebase Cloud Messaging permissions
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Firebase Notification permission enabled');
      // On iOS, ensure the native device is registered for remote messages
      if (Platform.OS === 'ios') {
        try {
          await messaging().registerDeviceForRemoteMessages();
        } catch (err) {
          console.log('Error registering device for remote messages:', err);
        }
        // give iOS a moment to register with APNs before requesting FCM token
        await new Promise(res => setTimeout(res, 2000));
      }

      await getFcmToken({ maxAttempts: 12, intervalMs: 2000 });
    } else {
      console.log('Firebase Notification permission denied or provisional');
    }

    // ✅ Request Notifee permissions (for iOS notification display)
    await notifee.requestPermission();

    // ✅ iOS-specific: Request UNUserNotificationCenter permissions
    if (Platform.OS === 'ios') {
      try {
        const settings = await notifee.getNotificationSettings();
        if (settings.ios.authorizationStatus === IOSAuthorizationStatus.NOT_DETERMINED) {
          await notifee.requestPermission();
        }
      } catch (error) {
        console.log('Error requesting iOS notification permissions:', error);
      }
    }
  } catch (error) {
    console.log('Error requesting permissions:', error);
  }
}

// 🎯 2️⃣ Get FCM token with retry for iOS APNs propagation
export const getFcmToken = async (opts?: { maxAttempts?: number; intervalMs?: number }) => {
  const maxAttempts = opts?.maxAttempts ?? 6;
  const intervalMs = opts?.intervalMs ?? 1000;

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  try {
    // On iOS ensure APNs token is available before attempting to fetch FCM token
    if (Platform.OS === 'ios') {
      let apnsAttempt = 0;
      while (apnsAttempt < maxAttempts) {
        try {
          const apns = await messaging().getAPNSToken();
          if (apns) {
            console.log('APNs token available:', apns);
            break;
          }
        } catch (apnsErr) {
          // getAPNSToken may throw on some RNFB versions; ignore and retry
          console.log('getAPNSToken check error:', apnsErr);
        }

        apnsAttempt += 1;
        console.log(`Waiting for APNs token, attempt ${apnsAttempt}/${maxAttempts}`);
        await sleep(intervalMs);
      }
    }
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        console.log("FCM. Fetch fcm token...");
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          console.log('FCM. FCM Token:', fcmToken);
          await AsyncStorage.setItem(STRINGS.FCM_TOKEN, fcmToken);
          return fcmToken;
        }
      } catch (err: any) {
        const msg = String(err?.message || err);
        // Common iOS error when APNs token not yet available
        if (Platform.OS === 'ios' && msg.includes('No APNS token')) {
          console.log(`Attempt ${attempt + 1}: APNs token not available yet, retrying...`);
        } else {
          console.log('Error getting FCM token (non-retriable):', err);
          throw err;
        }
      }

      attempt += 1;
      await sleep(intervalMs);
    }

    throw new Error('FCM token not available after retries');
  } catch (error) {
    console.log('Error getting FCM token:', error);
    return null;
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

  // Create the channel if it doesn't exist (Android only)
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: channelId,
      name: `Trip Updates - ${title}`,
      importance: AndroidImportance.HIGH,
      sound, // matches res/raw/{sound}.mp3
    });
  }

  return channelId;
}

// 🔊 4️⃣ Display notification
async function displayNotification(title: string, body: string) {
  const channelId = await getChannelIdForTitle(title);

  const notificationConfig: any = {
    title,
    body,
  };

  if (Platform.OS === 'android') {
    notificationConfig.android = {
      channelId,
      importance: AndroidImportance.HIGH,
    };
  } else if (Platform.OS === 'ios') {
    // ✅ iOS-specific notification settings
    notificationConfig.ios = {
      sound: 'default',
      critical: true,
    };
  }

  await notifee.displayNotification(notificationConfig);
}

// 🎯 5️⃣ Hook implementation
export const useNotifications = () => {
  useEffect(() => {
    // Request permissions
    requestPermissions();

    const unsubscribers: (() => void)[] = [];

    // ✅ Listen for foreground FCM messages (when app is open)
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);

      const title = remoteMessage.notification?.title || 'Notification';
      const body = remoteMessage.notification?.body || '';
      const data = remoteMessage.data || {};

      await displayNotification(title, body);

      // ✅ You can also trigger navigation or other actions here
      if (data) {
        console.log('Message data:', data);
      }
    });

    // ✅ Listen for background messages (iOS specific - when notification is tapped)
    if (Platform.OS === 'ios') {
      // Handle background message
      const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('App opened from background notification:', remoteMessage);

        const title = remoteMessage?.notification?.title || 'Notification';
        const body = remoteMessage?.notification?.body || '';

        console.log(`User opened notification: ${title} - ${body}`);
        // ✅ Handle navigation or other app logic here
      });

      unsubscribers.push(unsubscribeBackground);

      // ✅ Get initial notification (when app was killed and reopened)
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('App opened from killed state via notification:', remoteMessage);
            const title = remoteMessage?.notification?.title || 'Notification';
            const body = remoteMessage?.notification?.body || '';
            console.log(`Notification: ${title} - ${body}`);
          }
        });

      // ✅ Handle FCM token refresh
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(() => {
        console.log('FCM Token refreshed');
        getFcmToken();
      });

      unsubscribers.push(unsubscribeTokenRefresh);
    }

    // ✅ Android specific: Handle background messages
    if (Platform.OS === 'android') {
      // Android: Handle when notification is tapped
      const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Android: App opened from background notification:', remoteMessage);

        const title = remoteMessage?.notification?.title || 'Notification';
        const body = remoteMessage?.notification?.body || '';

        console.log(`User opened notification: ${title} - ${body}`);
      });

      unsubscribers.push(unsubscribeBackground);

      // Get initial notification for Android
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('Android: App opened from killed state via notification:', remoteMessage);
          }
        });

      // Handle FCM token refresh
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(() => {
        console.log('FCM Token refreshed');
        getFcmToken();
      });

      unsubscribers.push(unsubscribeTokenRefresh);
    }

    unsubscribers.push(unsubscribeForeground);

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);
};
