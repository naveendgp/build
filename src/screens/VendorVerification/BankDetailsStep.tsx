import React from 'react';
import { View } from 'react-native';
import CustomTextInput from '../../components/TextInput';

interface BankDetailsStepProps {
  bankDetails: {
    account_number: string;
    account_holder_name: string;
    bank_branch: string;
    ifsc_code: string;
  };
  setBankDetails: React.Dispatch<
    React.SetStateAction<{
      account_number: string;
      bank_branch: string;
      ifsc_code: string;
      account_holder_name: string;
    }>
  >;
}

const BankDetailsStep: React.FC<BankDetailsStepProps> = ({
  bankDetails,
  setBankDetails,
}) => {
  return (
    <View style={{ marginTop: 18 }}>
      <CustomTextInput
        label="Account Number"
        placeholder="Enter account number"
        keyboardType="number-pad"
        value={bankDetails.account_number}
        onChangeText={val =>
          setBankDetails(b => ({ ...b, account_number: val }))
        }
      />
      <CustomTextInput
        label="Account Holder Name"
        placeholder="Enter account holder name"
        value={bankDetails.account_holder_name}
        onChangeText={val =>
          setBankDetails(b => ({ ...b, account_holder_name: val }))
        }
      />

      <CustomTextInput
        label="Bank Branch"
        placeholder="Enter bank branch"
        value={bankDetails.bank_branch}
        onChangeText={val => setBankDetails(b => ({ ...b, bank_branch: val }))}
      />

      <CustomTextInput
        label="IFSC Code"
        placeholder="Enter IFSC code"
        value={bankDetails.ifsc_code}
        onChangeText={val => setBankDetails(b => ({ ...b, ifsc_code: val }))}
      />
    </View>
  );
};

export default BankDetailsStep;
