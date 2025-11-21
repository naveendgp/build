import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useRef, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  View,
} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import CustomToast from './src/components/CustomToast';
import CustomeDialog from './src/components/Dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainerRef } from '@react-navigation/native';
import { useAuthStore } from './src/apiService/store/useAuthStore';
import { useDialogStore } from './src/apiService/store/useDialogStore';
import { useNotifications } from './src/services/Notification/useNotifications';

const queryClient = new QueryClient();


const ScreenWrapper = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top, // Need to adjust this based Gradient Bg req
        paddingBottom: insets.bottom,
        backgroundColor: "#ffffff",
      }}
    >
      {children}
    </View>
  );
};

const App = () => {

  useNotifications();


  const isDarkMode = useColorScheme() === 'dark';
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const { setNavigationRef, navigationRef: authNavigationRef } = useAuthStore();
  const {
    visible,
    title,
    subtitle,
    buttonText,
    hideDialog,
    imageSource,
    onClose,
    closable,
  } = useDialogStore();


  // Set navigation ref in auth store
  useEffect(() => {
    setNavigationRef(navigationRef);
  }, [setNavigationRef]);

  const handleDialogButtonPress = () => {
    // Execute the onClose callback if it exists (this will call logout)
    if (onClose) {
      onClose();
    }
    hideDialog();

    // Navigate to Login screen
    const { navigationRef: storeNavRef } = useAuthStore.getState();
    const navRef = storeNavRef || navigationRef;
    if (navRef?.current) {
      navRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <ScreenWrapper>
            <GestureHandlerRootView style={styles.container}>
              <StatusBar barStyle={'dark-content'} />
              <AppNavigator />
              <CustomToast />
              <CustomeDialog
                visible={visible}
                title={title}
                subtitle={subtitle}
                buttonText={buttonText}

                onButtonPress={handleDialogButtonPress}
                closable={closable}
                onClose={closable ? handleDialogButtonPress : undefined}
              />
            </GestureHandlerRootView>
          </ScreenWrapper>
        </SafeAreaView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
