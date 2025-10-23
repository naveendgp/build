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
// import { useNotifications } from './src/services/Notification/useNotifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDialogStore } from './src/apiService/store/useDialogStore';
import { useAuthStore } from './src/apiService/store/useAuthStore';
import CustomeDialog from './src/components/Dialog';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainerRef } from '@react-navigation/native';

const queryClient = new QueryClient();

const ScreenWrapper = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: '#ffffff',
      }}
    >
      {children}
    </View>
  );
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const { setNavigationRef } = useAuthStore();
  const {
    visible,
    title,
    subtitle,
    buttonText,
    hideDialog,
    imageSource,
    onClose,
  } = useDialogStore();
  // useNotifications();

  // Set navigation ref in auth store
  useEffect(() => {
    setNavigationRef(navigationRef);
  }, [setNavigationRef]);

  const handleDialogClose = () => {
    hideDialog();
    // Execute the onClose callback if it exists (this will call logout)
    if (onClose) {
      onClose();
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ScreenWrapper>
          <GestureHandlerRootView style={styles.container}>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            />
            <AppNavigator ref={navigationRef} />
            <CustomToast />
            <CustomeDialog
              visible={visible}
              title={title}
              subtitle={subtitle}
              buttonText={buttonText}
              onButtonPress={handleDialogClose}
              btnVisible={true}
              imageSource={imageSource}
            />
          </GestureHandlerRootView>
        </ScreenWrapper>
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
