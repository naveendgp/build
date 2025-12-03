import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker';
import CustomText from '../../../components/Text';
import CustomTextInput from '../../../components/TextInput';
import ProfileInput from '../../../components/ProfileInput';
import styles from './vendorDetailsStyles';
import PlusIcon from '../../../assets/auto-generated-svg-icons/PlusIcon';
import CalendarIcon from '../../../assets/auto-generated-svg-icons/CalendarIcon';
import UploadIcon from '../../../assets/auto-generated-svg-icons/UploadIcon';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import CloseIcon from '../../../assets/auto-generated-svg-icons/CloseIcon';
import { COLORS } from '../../../constants/colors';
import { VendorErrors } from '../useVendorValidation';

interface VendorData {
  owner_name: string;
  email: string;
  address: string;
  aadhaar_no: string;
  pan_number: string;
  mobile: string;
  date_of_birth: string;
  profile_pic: string | { uri: string; name?: string } | null;
  aadhaar_file: { uri: string; name: string } | null;
  pan_file: { uri: string; name: string } | null;
}

interface Props {
  vendor: VendorData;
  setVendor: (v: VendorData) => void;
  handleFocusScroll: (ref: any) => void;
  vendorAddressRef: React.RefObject<View | null>;
  isMobileFromOtp?: boolean;
  errors?: VendorErrors;
  clearError?: (field: keyof VendorErrors) => void;
}

const VendorDetailsStep: React.FC<Props> = ({
  vendor,
  setVendor,
  isMobileFromOtp = false,
  errors = {},
  clearError,
}) => {
  const [ageError, setAgeError] = useState<string>('');

  // Helper function to get profile pic URI safely
  const getProfilePicUri = (): string | undefined => {
    if (!vendor.profile_pic) return undefined;
    if (typeof vendor.profile_pic === 'string') {
      return vendor.profile_pic;
    }
    if (typeof vendor.profile_pic === 'object' && vendor.profile_pic !== null && 'uri' in vendor.profile_pic) {
      return vendor.profile_pic.uri;
    }
    return undefined;
  };

  const pickProfilePic = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, res => {
      if (res.assets?.[0]?.uri) {
        setVendor({ ...vendor, profile_pic: res.assets[0].uri });
      }
    });
  };

  const pickDocument = (type: 'aadhaar' | 'pan') => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick document');
        return;
      }
      if (response.assets?.[0]?.uri) {
        const fileUri = response.assets[0].uri;
        const fileName = response.assets[0].fileName || `document_${type}.pdf`;
        if (type === 'aadhaar') {
          setVendor({
            ...vendor,
            aadhaar_file: { uri: fileUri, name: fileName },
          });
        } else {
          setVendor({
            ...vendor,
            pan_file: { uri: fileUri, name: fileName },
          });
        }
      }
    });
  };

  const removeDocument = (type: 'aadhaar' | 'pan') => {
    if (type === 'aadhaar') {
      setVendor({ ...vendor, aadhaar_file: null });
    } else {
      setVendor({ ...vendor, pan_file: null });
    }
  };


  return (
    <View style={styles.card}>
      {/* Profile Picture Section */}
      <View style={styles.profilePicContainer}>
        <TouchableOpacity
          onPress={pickProfilePic}
          style={styles.profilePicPlaceholder}
        >
          {getProfilePicUri() ? (
            <Image
              source={{ uri: getProfilePicUri()! }}
              style={styles.profilePic}
            />
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={pickProfilePic}
          style={styles.plusIconContainer}
        >
          <PlusIcon width={16} height={16} color={COLORS.GREEN} />
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <ProfileInput
        label="Full Name"
        required
        inputType="normal"
        value={vendor.owner_name}
        onChangeText={val => {
          setVendor({ ...vendor, owner_name: val });
          clearError?.('owner_name');
        }}
        containerStyle={styles.inputContainer}
        error={errors.owner_name}
      />

      <ProfileInput
        label="Mobile Number"
        required
        inputType="phone"
        countryCode="+91"
        value={vendor.mobile || ''}
        onChangeText={val => {
          setVendor({ ...vendor, mobile: val });
          clearError?.('mobile');
        }}
        containerStyle={styles.inputContainer}
        isEditable={!isMobileFromOtp}
        error={errors.mobile}
      />

      <ProfileInput
        label="Email ID"
        inputType="email"
        value={vendor.email}
        onChangeText={val => {
          setVendor({ ...vendor, email: val });
          clearError?.('email');
        }}
        containerStyle={styles.inputContainer}
        error={errors.email}
      />

      {/* <View style={styles.dateInputContainer}>
        <CustomText style={styles.dateLabel}>Date Of Birth</CustomText>
        <View style={styles.dateInput}>
          <CalendarIcon
            width={20}
            height={20}
            color={COLORS.LOGIN_SUBTITLE}
          />
          <CustomTextInput
            placeholder="DD/MM/YYYY"
            value={vendor.date_of_birth || ''}
            onChangeText={handleDateInput}
            keyboardType="number-pad"
            maxLength={10}
            style={styles.dateTextInput}
            containerStyle={styles.dateInputField}
            label=""
          />
        </View>
        {ageError ? (
          <CustomText style={styles.dateErrorText}>{ageError}</CustomText>
        ) : null}
      </View> */}

      {/* Government ID (Aadhaar) Upload Section */}
      <View style={styles.uploadSection}>
        <CustomText style={styles.uploadLabel}>
          Government ID (Aadhaar)
        </CustomText>
        {!vendor.aadhaar_file ? (
          <TouchableOpacity
            onPress={() => pickDocument('aadhaar')}
            style={styles.uploadButton}
          >
            <UploadIcon width={24} height={24} color={COLORS.LOGIN_SUBTITLE} />
            <CustomText style={styles.uploadText}>Upload files</CustomText>
          </TouchableOpacity>
        ) : (
          <View style={styles.uploadedFileContainer}>
            <View style={styles.uploadedFileInfo}>
              <CheckIcon width={24} height={24} color={COLORS.SUCCESS} />
              <CustomText style={styles.uploadedFileName} numberOfLines={1}>
                {vendor.aadhaar_file.name || 'Filename.pdf'}
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={() => removeDocument('aadhaar')}
              style={styles.removeButton}
            >
              <CloseIcon width={24} height={24} color={COLORS.LOGIN_SUBTITLE} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Government ID (PAN) Upload Section */}
      <View style={styles.uploadSection}>
        <CustomText style={styles.uploadLabel}>
          Government ID (PAN)
        </CustomText>
        {!vendor.pan_file ? (
          <TouchableOpacity
            onPress={() => pickDocument('pan')}
            style={styles.uploadButton}
          >
            <UploadIcon width={24} height={24} color={COLORS.LOGIN_SUBTITLE} />
            <CustomText style={styles.uploadText}>Upload files</CustomText>
          </TouchableOpacity>
        ) : (
          <View style={styles.uploadedFileContainer}>
            <View style={styles.uploadedFileInfo}>
              <CheckIcon width={24} height={24} color={COLORS.SUCCESS} />
              <CustomText style={styles.uploadedFileName} numberOfLines={1}>
                {vendor.pan_file.name || 'Filename.pdf'}
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={() => removeDocument('pan')}
              style={styles.removeButton}
            >
              <CloseIcon width={24} height={24} color={COLORS.LOGIN_SUBTITLE} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default VendorDetailsStep;
