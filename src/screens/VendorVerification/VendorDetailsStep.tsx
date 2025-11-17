import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker';
import CustomText from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import ProfileInput from '../../components/ProfileInput';
import styles from './vendorDetailsStyles';
import PlusIcon from '../../assets/auto-generated-svg-icons/PlusIcon';
import CalendarIcon from '../../assets/auto-generated-svg-icons/CalendarIcon';
import UploadIcon from '../../assets/auto-generated-svg-icons/UploadIcon';
import CheckIcon from '../../assets/auto-generated-svg-icons/CheckIcon';
import CloseIcon from '../../assets/auto-generated-svg-icons/CloseIcon';
import { COLORS } from '../../constants/colors';

interface Props {
  vendor: any;
  setVendor: (v: any) => void;
  handleFocusScroll: (ref: any) => void;
  vendorAddressRef: React.RefObject<View | null>;
}

const VendorDetailsStep: React.FC<Props> = ({
  vendor,
  setVendor,
  handleFocusScroll,
  vendorAddressRef,
}) => {
  const [ageError, setAgeError] = useState<string>('');

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (day > 0 && day <= 31 && month >= 0 && month < 12 && year > 1900) {
          return new Date(year, month, day);
        }
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
    return null;
  };

  const handleDateInput = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as DD/MM/YYYY
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    }
    
    // Limit to 10 characters (DD/MM/YYYY)
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }

    setVendor({ ...vendor, date_of_birth: formatted });

    // Validate age if date is complete
    if (formatted.length === 10) {
      const date = parseDate(formatted);
      if (date) {
        const age = calculateAge(date);
        if (age < 18) {
          setAgeError('You must be at least 18 years old to register');
        } else {
          setAgeError('');
        }
      } else {
        setAgeError('Please enter a valid date (DD/MM/YYYY)');
      }
    } else {
      setAgeError('');
    }
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
          {vendor.profile_pic ? (
            <Image
              source={{ uri: vendor.profile_pic }}
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
        onChangeText={val => setVendor({ ...vendor, owner_name: val })}
        containerStyle={styles.inputContainer}
      />

      <ProfileInput
        label="Mobile Number"
        required
        inputType="phone"
        countryCode="+91"
        value={vendor.mobile || ''}
        onChangeText={val => setVendor({ ...vendor, mobile: val })}
        containerStyle={styles.inputContainer}
      />

      <ProfileInput
        label="Email ID"
        inputType="email"
        value={vendor.email}
        onChangeText={val => setVendor({ ...vendor, email: val })}
        containerStyle={styles.inputContainer}
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
