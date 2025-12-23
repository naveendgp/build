import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

// // 🔥 Runs when app is BACKGROUND / KILLED
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//     console.log('🔥 Background / Killed FCM:', remoteMessage);

//     const title =
//         remoteMessage.notification?.title || 'New Notification';
//     const body =
//         remoteMessage.notification?.body || '';

//     await notifee.displayNotification({
//         title,
//         body,
//         android: {
//             channelId: 'orders_v3',
//             importance: AndroidImportance.HIGH,
//             smallIcon: 'ic_launcher',
//             pressAction: {
//                 id: 'default',
//                 launchActivity: 'default',
//             },
//         },
//     });
// });
