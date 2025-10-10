import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import CustomToast from './src/components/CustomToast';
// import { useNotifications } from './src/services/Notification/useNotifications';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  // useNotifications();

  return (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppNavigator />
        <CustomToast />
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
