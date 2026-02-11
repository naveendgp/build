import { GestureHandlerRootView } from "react-native-gesture-handler";
import React from "react";
import {
  StatusBar,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { useNotifications } from "./src/services/Notification/useNotifications";
import CustomToast from "./src/components/Toast/CustomToast";
import { COLORS } from "./src/constants";
import {
  SafeAreaProvider,
} from "react-native-safe-area-context";
import DialogProvider from "./src/components/SessionHandler/DialogProvider";



const App = () => {
  useNotifications();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <AppNavigator />
        <DialogProvider />
        <CustomToast />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
});

export default App;
