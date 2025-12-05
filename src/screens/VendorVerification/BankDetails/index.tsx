import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { updateBankDetailsWithCheque } from '../../../apiService/api/profileApi';
import { UpdateBankDetailsInputWithCheque } from '../../../apiService/types/profileTypes';
import { showErrorToast, showSuccessToast } from '../../../utils/Toast';
import { getMimeTypeFromExtension } from '../../../utils/fileUtils';
import BankDetailsStep from './BankDetailsStep';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';

type BankDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'BankDetails'>;

const BankDetailsScreen: React.FC = () => {
  const navigation = useNavigation<BankDetailsNavProp>();
  const route = useRoute();
  const { bank: storeBank, setBankData } = useVendorVerificationStore();
  const { profile } = useProfileStore();
  const isReadOnly = !!(route.params as any)?.readOnly;

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

  // Helper function to normalize file object
  const normalizeFile = (file: any, defaultName: string) => {
    if (!file) return undefined;
    // Handle string URI (from API)
    if (typeof file === 'string') {
      return {
        uri: file,
        name: defaultName,
        type: getMimeTypeFromExtension(defaultName),
      };
    }
    // Handle object with uri and name
    if (file.uri) {
      const fileName = file.name || defaultName;
      const mimeType = getMimeTypeFromExtension(fileName);
      return {
        uri: file.uri,
        name: fileName,
        type: mimeType,
      };
    }
    return undefined;
  };

  const updateBankMutation = useMutation({
    mutationFn: async () => {
      const payload: UpdateBankDetailsInputWithCheque = {
        account_holder_name: bank.account_holder_name,
        account_number: bank.account_number,
        ifsc_code: bank.ifsc_code,
        bank_name: bank.bank_name,
        branch: '', // Optional field
        upi_id: bank.upi_id,
      };

      const images = {
        cancelled_cheque: normalizeFile(bank.cancelled_cheque, 'cancelled_cheque.jpg'),
      };

      return updateBankDetailsWithCheque(payload, images);
    },
    onSuccess: (data) => {
      if (data.status) {
        showSuccessToast(data.message || 'Bank details updated successfully');
        // Save to store
        setBankData(bank);
        // Refresh profile data
        useProfileStore.getState().refreshProfile();
        // Navigate back
        navigation.goBack();
      } else {
        showErrorToast(data.message || 'Failed to update bank details');
      }
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const msg = error.response?.data?.message || error.message;
      showErrorToast(msg || 'Failed to update bank details');
    },
  });

  const handleSave = () => {
    if (isReadOnly) return;
    updateBankMutation.mutate();
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
              isEditable={!isReadOnly}
            />
            {!isReadOnly ? (
              <View style={styles.buttonRow}>
                <CustomBtn
                  title={isReadOnly ? "View Only" : updateBankMutation.isPending ? "Saving..." : "Save"}
                  onPress={handleSave}
                  disabled={updateBankMutation.isPending || isReadOnly}
                  style={styles.nextButton}
                  textStyle={styles.nextButtonText}
                />
              </View>
            ) : null}
            {updateBankMutation.isPending && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BankDetailsScreen;

