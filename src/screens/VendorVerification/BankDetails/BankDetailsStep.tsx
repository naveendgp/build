import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import ProfileInput from '../../../components/ProfileInput';
import CustomText from '../../../components/Text';
import UploadIcon from '../../../assets/auto-generated-svg-icons/UploadIcon';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import CloseIcon from '../../../assets/auto-generated-svg-icons/CloseIcon';
import { COLORS } from '../../../constants/colors';
import styles from './bankDetailsStyles';
import { BankErrors } from '../useVendorValidation';

interface Props {
  bank: any;
  setBank: (b: any) => void;
  errors?: BankErrors;
}

const BankDetailsStep: React.FC<Props> = ({ bank, setBank, errors = {} }) => {
  const pickCancelledCheque = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick file');
        return;
      }

      if (response.assets?.[0]?.uri) {
        const fileUri = response.assets[0].uri;
        const fileName = response.assets[0].fileName || 'cancelled_cheque.jpg';
        setBank({
          ...bank,
          cancelled_cheque: { uri: fileUri, name: fileName },
        });
      }
    });
  };

  const removeCheque = () => {
    setBank({ ...bank, cancelled_cheque: null });
  };

  return (
    <View style={styles.card}>
      <ProfileInput
        label="Account Holder Name"
        required
        value={bank.account_holder_name || ''}
        onChangeText={val => setBank({ ...bank, account_holder_name: val })}
        containerStyle={styles.inputContainer}
        error={errors.account_holder_name}
      />

      <ProfileInput
        label="Account Number"
        required
        value={bank.account_number || ''}
        onChangeText={val => setBank({ ...bank, account_number: val })}
        keyboardType="number-pad"
        containerStyle={styles.inputContainer}
        error={errors.account_number}
      />

      <ProfileInput
        label="Bank Name"
        required
        value={bank.bank_name || ''}
        onChangeText={val => setBank({ ...bank, bank_name: val })}
        containerStyle={styles.inputContainer}
        error={errors.bank_name}
      />

      <ProfileInput
        label="IFSC Code"
        required
        value={bank.ifsc_code || ''}
        onChangeText={val => setBank({ ...bank, ifsc_code: val })}
        containerStyle={styles.inputContainer}
        autoCapitalize="characters"
        error={errors.ifsc_code}
      />

      <ProfileInput
        label="UPI ID"
        value={bank.upi_id || ''}
        placeholder="example@upi"
        onChangeText={val => setBank({ ...bank, upi_id: val })}
        containerStyle={styles.inputContainer}
      />

      <View style={styles.uploadSection}>
        <CustomText style={styles.uploadLabel}>
          Upload Cancelled Cheque<CustomText style={styles.asterisk}>*</CustomText>
        </CustomText>
        {!bank.cancelled_cheque ? (
          <TouchableOpacity style={styles.uploadButton} onPress={pickCancelledCheque}>
            <UploadIcon width={24} height={24} color={COLORS.LOGIN_SUBTITLE} />
            <CustomText style={styles.uploadText}>Upload files</CustomText>
          </TouchableOpacity>
        ) : (
          <View style={styles.uploadedFileContainer}>
            <View style={styles.uploadedFileInfo}>
              <CheckIcon width={20} height={20} color={COLORS.SUCCESS} />
              <CustomText style={styles.uploadedFileName} numberOfLines={1}>
                {bank.cancelled_cheque.name || 'Filename.pdf'}
              </CustomText>
            </View>
            <TouchableOpacity onPress={removeCheque} style={styles.removeButton}>
              <CloseIcon width={16} height={16} color={COLORS.LOGIN_SUBTITLE} />
            </TouchableOpacity>
          </View>
        )}
        {errors.cancelled_cheque && (
          <CustomText style={styles.errorText}>{errors.cancelled_cheque}</CustomText>
        )}
      </View>
    </View>
  );
};

export default BankDetailsStep;
