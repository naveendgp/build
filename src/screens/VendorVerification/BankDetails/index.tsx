import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
import BankDetailsStep from './BankDetailsStep';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';

type BankDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'BankDetails'>;

const BankDetailsScreen: React.FC = () => {
  const navigation = useNavigation<BankDetailsNavProp>();
  const { bank: storeBank, setBankData } = useVendorVerificationStore();
  const { profile } = useProfileStore();

  // Initialize from profile store if available, otherwise from vendor verification store
  const buildDocumentFile = (uri?: string, fallback?: { uri: string; name?: string } | null, defaultName?: string) => {
    if (uri) {
      return { uri, name: defaultName || 'Document' };
    }
    return fallback || null;
  };

  const getInitialBankData = () => {
    if (profile?.bank_details) {
      return {
        account_number: profile.bank_details.account_number || '',
        account_holder_name: profile.bank_details.account_holder_name || '',
        ifsc_code: profile.bank_details.ifsc_code || '',
        bank_name: profile.bank_details.bank_name || '',
        upi_id: storeBank.upi_id || '',
        cancelled_cheque: buildDocumentFile(profile.documents?.pan_card, storeBank.cancelled_cheque, 'PAN Document'),
      };
    }
    // Fallback to vendor verification store
    return {
      account_number: storeBank.account_number || '',
      account_holder_name: storeBank.account_holder_name || '',
      ifsc_code: storeBank.ifsc_code || '',
      bank_name: storeBank.bank_name || '',
      upi_id: storeBank.upi_id || '',
      cancelled_cheque: storeBank.cancelled_cheque || null,
    };
  };

  const [bank, setBank] = useState(getInitialBankData());

  // Update bank when profile changes
  useEffect(() => {
    if (profile?.bank_details) {
      setBank(prev => ({
        ...prev,
        account_number: profile.bank_details?.account_number || prev.account_number,
        account_holder_name: profile.bank_details?.account_holder_name || prev.account_holder_name,
        ifsc_code: profile.bank_details?.ifsc_code || prev.ifsc_code,
        bank_name: profile.bank_details?.bank_name || prev.bank_name,
        cancelled_cheque: buildDocumentFile(profile.documents?.pan_card, prev.cancelled_cheque, 'PAN Document'),
      }));
    }
  }, [profile]);

  // Update bank when store changes (fallback)
  useEffect(() => {
    if (!profile?.bank_details && storeBank.account_holder_name) {
      setBank(prev => ({
        ...prev,
        ...storeBank,
      }));
    }
  }, [storeBank, profile]);

  const handleSave = () => {
    // Save to store
    setBankData(bank);
    // Navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.WHITE }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Toolbar title="Bank Details" />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20 }}
          >
            <BankDetailsStep
              bank={bank}
              setBank={setBank}
            />
            <View style={styles.buttonRow}>
              <CustomBtn
                title="Save"
                onPress={handleSave}
                style={styles.nextButton}
                textStyle={styles.nextButtonText}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BankDetailsScreen;

