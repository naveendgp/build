import React, { useState, useRef, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
import { useAuthStore } from '../../../apiService/store/useAuthStore';
import VendorDetailsStep from './VendorDetailsStep';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';

type ProfileDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'ProfileDetails'>;

const ProfileDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ProfileDetailsNavProp>();
  const { vendor: storeVendor, setVendorData } = useVendorVerificationStore();
  const { profile } = useProfileStore();
  const mobileNumber = useAuthStore(state => state.mobileNumber);

  const buildDocumentFile = (uri?: string, fallback?: { uri: string; name?: string } | null, defaultName?: string) => {
    if (uri) {
      return { uri, name: defaultName || 'Document' };
    }
    return fallback || null;
  };

  // Initialize from profile store if available, otherwise from vendor verification store
  const getInitialVendorData = () => {
    if (profile) {
      return {
        owner_name: profile.owner_name || '',
        email: profile.email || '',
        address: profile.address?.address_line1 || '',
        aadhaar_no: profile.aadhaar_number || '',
        pan_number: profile.pan_number || '',
        mobile: profile.phone || mobileNumber || '',
        date_of_birth: storeVendor.date_of_birth || '',
        // Use profile_pic from API if available, otherwise use local selection
        profile_pic: profile.profile_pic || storeVendor.profile_pic || null,
        aadhaar_file: buildDocumentFile(profile.documents?.aadhaar_card, storeVendor.aadhaar_file, 'Aadhaar Document'),
        pan_file: buildDocumentFile(profile.documents?.pan_card, storeVendor.pan_file, 'PAN Document'),
      };
    }
    // Fallback to vendor verification store
    return {
      owner_name: storeVendor.owner_name || '',
      email: storeVendor.email || '',
      address: storeVendor.address || '',
      aadhaar_no: storeVendor.aadhaar_no || '',
      pan_number: storeVendor.pan_number || '',
      mobile: storeVendor.mobile || mobileNumber || '',
      date_of_birth: storeVendor.date_of_birth || '',
      profile_pic: storeVendor.profile_pic || null,
      aadhaar_file: storeVendor.aadhaar_file || null,
      pan_file: storeVendor.pan_file || null,
    };
  };

  const [vendor, setVendor] = useState(getInitialVendorData());
  const vendorAddressRef = useRef(null);

  // Update vendor when profile changes
  useEffect(() => {
    if (profile) {
      setVendor(prev => ({
        ...prev,
        owner_name: profile.owner_name || prev.owner_name,
        email: profile.email || prev.email,
        address: profile.address?.address_line1 || prev.address,
        aadhaar_no: profile.aadhaar_number || prev.aadhaar_no,
        pan_number: profile.pan_number || prev.pan_number,
        mobile: profile.phone || prev.mobile,
        // Use profile_pic from API if available, but keep local selection if user has selected a new one
        profile_pic: prev.profile_pic || profile.profile_pic || null,
        aadhaar_file: buildDocumentFile(profile.documents?.aadhaar_card, prev.aadhaar_file, 'Aadhaar Document'),
        pan_file: buildDocumentFile(profile.documents?.pan_card, prev.pan_file, 'PAN Document'),
      }));
    }
  }, [profile]);

  // Update vendor when store changes (fallback)
  useEffect(() => {
    if (!profile && storeVendor.owner_name) {
      setVendor(prev => ({
        ...prev,
        ...storeVendor,
      }));
    }
  }, [storeVendor, profile]);

  // Set mobile number from auth store when available
  useEffect(() => {
    if (mobileNumber && !vendor.mobile) {
      setVendor(prev => ({
        ...prev,
        mobile: mobileNumber,
      }));
    }
  }, [mobileNumber]);

  const handleSave = () => {
    // Save to store
    setVendorData(vendor);
    // Navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.WHITE }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Toolbar title="Profile Details" />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20 }}
          >
            <VendorDetailsStep
              vendor={vendor}
              setVendor={setVendor}
              handleFocusScroll={() => { }}
              vendorAddressRef={vendorAddressRef}
              isMobileFromOtp={!!mobileNumber}
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

export default ProfileDetailsScreen;

