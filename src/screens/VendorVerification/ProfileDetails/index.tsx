import React, { useState, useRef, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
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
  const mobileNumber = useAuthStore(state => state.mobileNumber);

  const [vendor, setVendor] = useState({
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
  });

  const vendorAddressRef = useRef(null);

  // Update vendor when store changes
  useEffect(() => {
    if (storeVendor.owner_name) {
      setVendor(prev => ({
        ...prev,
        ...storeVendor,
      }));
    }
  }, [storeVendor]);

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
              handleFocusScroll={() => {}}
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

