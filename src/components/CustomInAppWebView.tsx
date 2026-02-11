import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTFAMILY } from '../constants';
interface CustomInAppWebViewProps {
  url: string;
  headerComponent?: React.ReactNode;
  onNavigationStateChange?: (navState: any) => void;
  onShouldStartLoadWithRequest?: (request: any) => boolean;
  headerTitle?: string;
}

const CustomInAppWebView: React.FC<CustomInAppWebViewProps> = ({
  url,
  headerComponent,
  onNavigationStateChange,
  onShouldStartLoadWithRequest,
  headerTitle
}) => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ fontSize: 18, color: 'white', marginStart: 12, paddingVertical: 8, fontFamily: FONTFAMILY.INTER_REGULAR }}>{headerTitle}</Text>
      </TouchableOpacity>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  webview: {
    flex: 1,
  },
});

export default CustomInAppWebView;