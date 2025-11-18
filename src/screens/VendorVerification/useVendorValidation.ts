import { Alert } from 'react-native';

export const useVendorValidation = () => {
  const validateStep = (step: number, data: any) => {
    if (step === 1) {
      const { owner_name, aadhaar_no, address, pan_number } = data.vendor;
      if (!owner_name.trim())
        return Alert.alert('Required', 'Owner name is required'), false;
      if (!pan_number.trim())
        return Alert.alert('Required', 'PAN number is required'), false;
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number))
        return Alert.alert('Invalid', 'PAN number format is invalid'), false;
      if (!/^[0-9]{12}$/.test(aadhaar_no))
        return Alert.alert('Invalid', 'Aadhaar must be 12 digits'), false;
      if (!address.trim())
        return Alert.alert('Required', 'Address is required'), false;
    }

    if (step === 2) {
      const { gst_number, address, city, state, pincode, shop_time, latitude, longitude } = data.shop;
      if (!gst_number.trim())
        return Alert.alert('Required', 'GST is required'), false;
      if (!address.trim())
        return Alert.alert('Required', 'Shop address is required'), false;
      if (!city.trim())
        return Alert.alert('Required', 'City is required'), false;
      if (!state.trim())
        return Alert.alert('Required', 'State is required'), false;
      if (!pincode.trim())
        return Alert.alert('Required', 'Pincode is required'), false;
      if (!/^[0-9]{6}$/.test(pincode))
        return Alert.alert('Invalid', 'Pincode must be 6 digits'), false;
      if (!shop_time.trim())
        return Alert.alert('Required', 'Shop time is required'), false;
      if (!latitude.trim())
        return Alert.alert('Required', 'Latitude is required'), false;
      if (!longitude.trim())
        return Alert.alert('Required', 'Longitude is required'), false;
    }

    if (step === 3) {
      const { account_number,   ifsc_code, bank_name } = data.bank;
      if (!account_number.trim())
        return Alert.alert('Required', 'Account number is required'), false;
      if (!ifsc_code.trim())
        return Alert.alert('Required', 'IFSC code is required'), false;
      if (!bank_name.trim())
        return Alert.alert('Required', 'Bank name is required'), false;
    }

    return true;
  };

  return { validateStep };
};
