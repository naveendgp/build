import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import styles from './styles';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import CustomBtn from '../../components/CustomBtn';
import {
  VendorProfile,
  UpdateBankDetailsInput,
  UpdateBankDetailsResponse,
} from '../../apiService/types/profileTypes';
import Toolbar from '../../components/Toolbar';
import { useMutation } from '@tanstack/react-query';
import { updateBankDetails } from '../../apiService/api/profileApi';
import { showErrorToast, showSuccessToast } from '../../utils/Toast';
import CustomTextInput from '../../components/TextInput';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../apiService/types/authTypes';

type WalletNavProp = NativeStackNavigationProp<RootStackParamList, 'Wallet'>;

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const WalletScreen: React.FC = () => {
  const navigation = useNavigation<WalletNavProp>();
  const { profile, refreshProfile } = useProfileStore();

  // Bank details form state
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);
  const [bankDetailsForm, setBankDetailsForm] = useState({
    account_holder_name: profile?.bank_details?.account_holder_name || '',
    account_number: profile?.bank_details?.account_number || '',
    ifsc_code: profile?.bank_details?.ifsc_code || '',
    bank_name: profile?.bank_details?.bank_name || '',
    branch: profile?.bank_details?.branch || '',
  });

  // Bank details mutation
  const updateBankDetailsMutation = useMutation<
    UpdateBankDetailsResponse,
    AxiosError<ErrorResponse>,
    UpdateBankDetailsInput
  >({
    mutationFn: updateBankDetails,
    onSuccess: async data => {
      showSuccessToast(data.message);
      await refreshProfile(); // Refresh profile data
      setIsEditingBankDetails(false);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      showErrorToast(
        error?.response?.data?.message || 'Failed to update bank details',
      );
    },
  });

  const handleAddMoney = () => {
    // TODO: Implement add money functionality
    console.log('Add money to wallet');
  };

  const handleWithdraw = () => {
    // TODO: Implement withdraw functionality
    console.log('Withdraw from wallet');
  };

  const handleEditBankDetails = () => {
    setIsEditingBankDetails(true);
    // Reset form to current profile data
    setBankDetailsForm({
      account_holder_name: profile?.bank_details?.account_holder_name || '',
      account_number: profile?.bank_details?.account_number || '',
      ifsc_code: profile?.bank_details?.ifsc_code || '',
      bank_name: profile?.bank_details?.bank_name || '',
      branch: profile?.bank_details?.branch || '',
    });
  };

  const handleCancelEdit = () => {
    setIsEditingBankDetails(false);
    // Reset form to original values
    setBankDetailsForm({
      account_holder_name: profile?.bank_details?.account_holder_name || '',
      account_number: profile?.bank_details?.account_number || '',
      ifsc_code: profile?.bank_details?.ifsc_code || '',
      bank_name: profile?.bank_details?.bank_name || '',
      branch: profile?.bank_details?.branch || '',
    });
  };

  const handleSaveBankDetails = () => {
    updateBankDetailsMutation.mutate(bankDetailsForm);
  };

  const updateBankDetailField = (
    field: keyof UpdateBankDetailsInput,
    value: string,
  ) => {
    setBankDetailsForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'credit',
      amount: 500,
      description: 'Order Payment',
      date: '2024-01-15',
      status: 'completed',
    },
    {
      id: '2',
      type: 'debit',
      amount: 50,
      description: 'Service Fee',
      date: '2024-01-14',
      status: 'completed',
    },
    {
      id: '3',
      type: 'credit',
      amount: 1200,
      description: 'Order Payment',
      date: '2024-01-13',
      status: 'completed',
    },
  ];

  const renderTransaction = (transaction: Transaction) => (
    <View key={transaction.id} style={styles.transactionCard}>
      <View style={styles.transactionInfo}>
        <CustomText style={styles.transactionDescription}>
          {transaction.description}
        </CustomText>
        <CustomText style={styles.transactionDate}>
          {transaction.date}
        </CustomText>
      </View>

      <View style={styles.transactionAmount}>
        <CustomText
          style={[
            styles.transactionValue,
            { color: transaction.type === 'credit' ? '#34C759' : '#FF3B30' },
          ]}
        >
          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
        </CustomText>
        <CustomText style={styles.transactionStatus}>
          {transaction.status}
        </CustomText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Wallet" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Wallet Balance</CustomText>

          <View style={styles.balanceCard}>
            <CustomText style={styles.balanceLabel}>
              Available Balance
            </CustomText>
            <CustomText style={styles.balanceAmount}>
              ₹{profile?.wallet?.balance || 0}
            </CustomText>
            <CustomText style={styles.balanceCurrency}>
              {profile?.wallet?.currency || 'INR'}
            </CustomText>
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Quick Actions</CustomText>

          <View style={styles.actionsContainer}>
            <CustomBtn title="Add Money" onPress={handleAddMoney} />

            <CustomBtn title="Withdraw" onPress={handleWithdraw} />
          </View>
        </View>

        {profile?.bank_details && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CustomText style={styles.sectionTitle}>Bank Details</CustomText>
              {!isEditingBankDetails && (
                <TouchableOpacity onPress={handleEditBankDetails}>
                  <CustomText style={styles.editButton}>Edit</CustomText>
                </TouchableOpacity>
              )}
            </View>

            {isEditingBankDetails ? (
              <View style={styles.bankDetailsCard}>
                <CustomTextInput
                  label="Account Holder Name"
                  value={bankDetailsForm.account_holder_name}
                  onChangeText={value =>
                    updateBankDetailField('account_holder_name', value)
                  }
                  placeholder="Enter account holder name"
                />

                <CustomTextInput
                  label="Account Number"
                  value={bankDetailsForm.account_number}
                  onChangeText={value =>
                    updateBankDetailField('account_number', value)
                  }
                  placeholder="Enter account number"
                  keyboardType="numeric"
                />

                <CustomTextInput
                  label="IFSC Code"
                  value={bankDetailsForm.ifsc_code}
                  onChangeText={value =>
                    updateBankDetailField('ifsc_code', value.toUpperCase())
                  }
                  placeholder="Enter IFSC code"
                  autoCapitalize="characters"
                />

                <CustomTextInput
                  label="Bank Name"
                  value={bankDetailsForm.bank_name}
                  onChangeText={value =>
                    updateBankDetailField('bank_name', value)
                  }
                  placeholder="Enter bank name"
                />

                <CustomTextInput
                  label="Branch"
                  value={bankDetailsForm.branch}
                  onChangeText={value => updateBankDetailField('branch', value)}
                  placeholder="Enter branch name"
                />

                <View style={styles.bankDetailsActions}>
                  <CustomBtn
                    title="Cancel"
                    onPress={handleCancelEdit}
                    disabled={updateBankDetailsMutation.isPending}
                  />
                  <CustomBtn
                    title={
                      updateBankDetailsMutation.isPending ? 'Saving...' : 'Save'
                    }
                    onPress={handleSaveBankDetails}
                    disabled={updateBankDetailsMutation.isPending}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.bankDetailsCard}>
                <View style={styles.bankDetailRow}>
                  <CustomText style={styles.bankDetailLabel}>
                    Account Holder
                  </CustomText>
                  <CustomText style={styles.bankDetailValue}>
                    {profile.bank_details.account_holder_name}
                  </CustomText>
                </View>

                <View style={styles.bankDetailRow}>
                  <CustomText style={styles.bankDetailLabel}>
                    Account Number
                  </CustomText>
                  <CustomText style={styles.bankDetailValue}>
                    {profile.bank_details.account_number}
                  </CustomText>
                </View>

                <View style={styles.bankDetailRow}>
                  <CustomText style={styles.bankDetailLabel}>
                    IFSC Code
                  </CustomText>
                  <CustomText style={styles.bankDetailValue}>
                    {profile.bank_details.ifsc_code}
                  </CustomText>
                </View>

                <View style={styles.bankDetailRow}>
                  <CustomText style={styles.bankDetailLabel}>
                    Bank Name
                  </CustomText>
                  <CustomText style={styles.bankDetailValue}>
                    {profile.bank_details.bank_name}
                  </CustomText>
                </View>

                <View style={styles.bankDetailRow}>
                  <CustomText style={styles.bankDetailLabel}>Branch</CustomText>
                  <CustomText style={styles.bankDetailValue}>
                    {profile.bank_details.branch}
                  </CustomText>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>
            Recent Transactions
          </CustomText>

          {transactions.map(renderTransaction)}
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Wallet Statistics</CustomText>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>₹2,500</CustomText>
              <CustomText style={styles.statLabel}>Total Earned</CustomText>
            </View>

            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>₹150</CustomText>
              <CustomText style={styles.statLabel}>Total Withdrawn</CustomText>
            </View>

            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>₹2,350</CustomText>
              <CustomText style={styles.statLabel}>Net Balance</CustomText>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WalletScreen;
