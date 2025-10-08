// FilePickerScreen.tsx
import React, { useRef } from 'react';
import {
  View,
  Button,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import RNFetchBlob from 'react-native-blob-util';

export default function FilePickerScreen() {
  // Optional: ref to the main View if needed
  const containerRef = useRef<View>(null);

  const pickFile = async () => {
    try {
      // 1️⃣ Request storage permission on Android >= 23
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to pick files',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Cannot pick file without permission.',
          );
          return;
        }
      }

      // 2️⃣ Open file picker (must be inside user interaction)
      const res = await RNFetchBlob.android.actionViewIntent(
        'content://', // generic content URI
        '*/*', // any file type
      );

      if (res) {
        Alert.alert('File Picked', `File URI: ${res}`);
        console.log('Picked file:', res);
      }
    } catch (err) {
      console.error('File pick error:', err);
      Alert.alert('Error', 'Failed to pick file.');
    }
  };

  return (
    <View ref={containerRef} style={styles.container}>
      <Button title="Pick a File" onPress={pickFile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
