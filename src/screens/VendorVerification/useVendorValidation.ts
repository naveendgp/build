import { Alert } from 'react-native';

export const useVendorValidation = () => {
  const validateStep = (step: number, data: any) => {
    if (step === 1) {
      const { owner_name, phone, aadhaar_no, address } = data.vendor;
      if (!owner_name.trim())
        return Alert.alert('Required', 'Owner name is required'), false;
      if (!/^[0-9]{10}$/.test(phone))
        return Alert.alert('Invalid', 'Phone must be 10 digits'), false;
      if (!/^[0-9]{12}$/.test(aadhaar_no))
        return Alert.alert('Invalid', 'Aadhaar must be 12 digits'), false;
      if (!address.trim())
        return Alert.alert('Required', 'Address is required'), false;
    }

    if (step === 2) {
      const { gst_number, address, shop_time } = data.shop;
      if (!gst_number.trim())
        return Alert.alert('Required', 'GST is required'), false;
      if (!address.trim())
        return Alert.alert('Required', 'Shop address is required'), false;
      if (!shop_time.trim())
        return Alert.alert('Required', 'Shop time is required'), false;
    }

    if (step === 3) {
      const { account_number, bank_branch, ifsc_code } = data.bank;
      if (!account_number.trim())
        return Alert.alert('Required', 'Account number is required'), false;
      if (!bank_branch.trim())
        return Alert.alert('Required', 'Bank branch is required'), false;
      if (!ifsc_code.trim())
        return Alert.alert('Required', 'IFSC code is required'), false;
    }

    return true;
  };

  return { validateStep };
};
