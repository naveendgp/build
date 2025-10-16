import React from 'react';
import { View } from 'react-native';
import CustomTextInput from '../../components/TextInput';

interface Props {
  bank: any;
  setBank: (b: any) => void;
}

const BankDetailsStep: React.FC<Props> = ({ bank, setBank }) => (
  <View>
    <CustomTextInput
      label="Account Number"
      value={bank.account_number}
      onChangeText={val => setBank({ ...bank, account_number: val })}
    />
    <CustomTextInput
      label="Account Holder Name"
      value={bank.account_holder_name}
      onChangeText={val => setBank({ ...bank, account_holder_name: val })}
    />
    <CustomTextInput
      label="Bank Branch"
      value={bank.bank_branch}
      onChangeText={val => setBank({ ...bank, bank_branch: val })}
    />
    <CustomTextInput
      label="IFSC Code"
      value={bank.ifsc_code}
      onChangeText={val => setBank({ ...bank, ifsc_code: val })}
    />
    <CustomTextInput
      label="Bank Name"
      value={bank.bank_name}
      onChangeText={val => setBank({ ...bank, bank_name: val })}
    />
  </View>
);

export default BankDetailsStep;
