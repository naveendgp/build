// src/utils/sessionHandler.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../state/zustand/authStore';
import { useCommonStore } from '../state/zustand/commonStore';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDialogStore } from '../components/SessionHandler/dialogStore';

let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

export const setNavigationRef = (ref: NavigationContainerRef<RootStackParamList> | null) => {
  navigationRef = ref;
};

export const handleSessionExpired = async () => {
  if ((handleSessionExpired as any).isShowing) return;
  (handleSessionExpired as any).isShowing = true;

  const { showDialog } = useDialogStore.getState();

  showDialog({
    title: 'Session Expired',
    content: 'Your session has expired. Please login again.',
    showSingleBtn: true,
    onConfirm: async () => {
      try {
        await useAuthStore.getState().logout();
        await useCommonStore.getState().logout();
        await AsyncStorage.clear();

        if (navigationRef) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Error during session expiration handling:', error);
      } finally {
        setTimeout(() => {
          (handleSessionExpired as any).isShowing = false;
        }, 1000);
      }
    },
  });
};


// import { Alert } from 'react-native';
// import { NavigationContainerRef } from '@react-navigation/native';
// import { useAuthStore } from '../state/zustand/authStore';
// import { useCommonStore } from '../state/zustand/commonStore';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { RootStackParamList } from '../navigation/AppNavigator';

// // Global navigation reference - will be set by AppNavigator
// let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

// export const setNavigationRef = (ref: NavigationContainerRef<RootStackParamList> | null) => {
//   navigationRef = ref;
// };

// export const handleSessionExpired = async () => {
//   // Prevent multiple dialogs from showing
//   if ((handleSessionExpired as any).isShowing) {
//     return;
//   }
//   (handleSessionExpired as any).isShowing = true;


//   Alert.alert(
//     'Session Expired',
//     'Your session has expired. Please login again.',
//     [
//       {
//         text: 'OK',
//         onPress: async () => {
//           try {
//             // Clear auth state
//             await useAuthStore.getState().logout();
//             await useCommonStore.getState().logout();

//             // Clear AsyncStorage
//             await AsyncStorage.clear();

//             // Navigate to Login screen
//             if (navigationRef) {
//               navigationRef.reset({
//                 index: 0,
//                 routes: [{ name: 'Login' }],
//               });
//             }
//           } catch (error) {
//             console.error('Error during session expiration handling:', error);
//           } finally {
//             // Reset flag after a delay
//             setTimeout(() => {
//               (handleSessionExpired as any).isShowing = false;
//             }, 1000);
//           }
//         },
//       },
//     ],
//     { cancelable: false }
//   );
// };

