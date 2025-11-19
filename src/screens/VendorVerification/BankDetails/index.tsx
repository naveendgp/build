import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
import BankDetailsStep from './BankDetailsStep';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';

type BankDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'BankDetails'>;

const BankDetailsScreen: React.FC = () => {
  const navigation = useNavigation<BankDetailsNavProp>();
  const { bank: storeBank, setBankData } = useVendorVerificationStore();

  const [bank, setBank] = useState({
    account_number: storeBank.account_number || '',
    account_holder_name: storeBank.account_holder_name || '',
    ifsc_code: storeBank.ifsc_code || '',
    bank_name: storeBank.bank_name || '',
    upi_id: storeBank.upi_id || '',
    cancelled_cheque: storeBank.cancelled_cheque || null,
  });

  // Update bank when store changes
  useEffect(() => {
    if (storeBank.account_holder_name) {
      setBank(prev => ({
        ...prev,
        ...storeBank,
      }));
    }
  }, [storeBank]);

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

