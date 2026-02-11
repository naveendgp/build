import React from 'react';
import { View, Alert, Platform } from 'react-native';
import { Text } from 'react-native';
import CustomInAppWebView from '../components/CustomInAppWebView';
import SvgBackArrowIcon from '../assets/auto-generated-svg-icons/BackArrowIcon';
import SvgAddIcon from '../assets/auto-generated-svg-icons/AddIcon';
import { useAuthStore } from '../state/zustand/authStore';

const InvoiceScreen: React.FC = () => {
  const invoiceUrl = 'https://slicedinvoices.com/pdf/wordpress-pdf-invoice-plugin-sample.pdf';
  const { user } = useAuthStore();

  const handleDownloadInvoice = async () => {
    try {
      const userMobile = user?.phoneNumber || 'unknown';
      const fileName = `invoice_${userMobile}_${Date.now()}.pdf`;

      if (Platform.OS === 'web') {
        // For web platform - using Linking to open URL
        // Since React Native doesn't have direct DOM access
        Alert.alert('Download', 'Please use your browser to download the invoice directly from the PDF viewer.');
      } else {
        // For mobile platforms - using react-native-fs or similar
        // Note: You'll need to install react-native-fs for mobile download
        Alert.alert(
          'Download Invoice',
          `Invoice will be downloaded as: ${fileName}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Download',
              onPress: () => {
                // TODO: Implement actual download using react-native-fs
                // const RNFS = require('react-native-fs');
                // const downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`;
                // const options = {
                //   fromUrl: invoiceUrl,
                //   toFile: downloadDest,
                // };
                // RNFS.downloadFile(options).promise.then(() => {
                //   Alert.alert('Success', 'Invoice downloaded successfully!');
                // }).catch(() => {
                //   Alert.alert('Error', 'Failed to download invoice');
                // });
                Alert.alert('Info', 'Download functionality needs react-native-fs package to be implemented');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download invoice');
    }
  };

  return (
    <CustomInAppWebView
      url={invoiceUrl}
      headerComponent={
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', justifyContent: 'space-between' }}>
          <SvgBackArrowIcon />
          <Text>Invoices</Text>
          <SvgAddIcon onPress={handleDownloadInvoice} />
        </View>
      }
    />
  );
};

export default InvoiceScreen;