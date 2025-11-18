import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import CustomText from '../../../components/Text';
import CustomBtn from '../../../components/CustomBtn';
import DetailItem from './DetailItem';
import styles from './style';
import EditIcon from '../../../assets/auto-generated-svg-icons/EditIcon';
import { COLORS } from '../../../constants/colors';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
import { useMutation } from '@tanstack/react-query';
import { registerComplete } from '../../../apiService/api/authApi';
import {
  RegisterCompletePayload,
  RegisterCompleteResponse,
  OperatingHours,
} from '../../../apiService/types/authTypes';
import { AxiosError } from 'axios';
import { showErrorToast, showSuccessToast } from '../../../utils/Toast';
import { useAuthStore } from '../../../apiService/store/useAuthStore';
import { useVendorValidation } from '../useVendorValidation';

type ReviewDetailsNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'ReviewDetails'
>;

const ReviewDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ReviewDetailsNavProp>();
  const setLoggedIn = useAuthStore(state => state.setIsLoggedIn);
  const { validateStep } = useVendorValidation();
  
  // Get data from store
  const { vendor, shop, bank, clearAll } = useVendorVerificationStore();
  
  // Helper function to parse business hours and repeat days into operating_hours
  const parseOperatingHours = (): OperatingHours => {
    const operatingHours: OperatingHours = {};
    
    // Parse business_hours (format: "10:00 AM - 08:00 PM" or "09:00 - 20:00")
    let openTime = '09:00';
    let closeTime = '20:00';
    
    if (shop.business_hours) {
      const timeMatch = shop.business_hours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        // Convert 12-hour format to 24-hour format if needed
        const startHour = parseInt(timeMatch[1]);
        const startMin = timeMatch[2];
        const startAmPm = timeMatch[3]?.toUpperCase();
        const endHour = parseInt(timeMatch[4]);
        const endMin = timeMatch[5];
        const endAmPm = timeMatch[6]?.toUpperCase();
        
        let startHour24 = startHour;
        if (startAmPm === 'PM' && startHour !== 12) startHour24 = startHour + 12;
        if (startAmPm === 'AM' && startHour === 12) startHour24 = 0;
        
        let endHour24 = endHour;
        if (endAmPm === 'PM' && endHour !== 12) endHour24 = endHour + 12;
        if (endAmPm === 'AM' && endHour === 12) endHour24 = 0;
        
        openTime = `${startHour24.toString().padStart(2, '0')}:${startMin}`;
        closeTime = `${endHour24.toString().padStart(2, '0')}:${endMin}`;
      } else {
        // Try 24-hour format directly
        const parts = shop.business_hours.split(' - ');
        if (parts.length === 2) {
          openTime = parts[0].trim();
          closeTime = parts[1].trim();
        }
      }
    }
    
    // Parse repeat_days to determine which days are active
    // Format: "Mon, Tue, Wed, Thu And Fri" or similar
    const repeatDays = shop.repeat_days || 'Mon, Tue, Wed, Thu, Fri, Sat, Sun';
    const dayMap: { [key: string]: string } = {
      'mon': 'monday',
      'tue': 'tuesday',
      'wed': 'wednesday',
      'thu': 'thursday',
      'fri': 'friday',
      'sat': 'saturday',
      'sun': 'sunday',
    };
    
    // Check which days are mentioned in repeat_days
    const lowerRepeat = repeatDays.toLowerCase();
    Object.keys(dayMap).forEach(shortDay => {
      if (lowerRepeat.includes(shortDay)) {
        operatingHours[dayMap[shortDay] as keyof OperatingHours] = {
          open: openTime,
          close: closeTime,
        };
      }
    });
    
    // If no days found, default to all weekdays
    if (Object.keys(operatingHours).length === 0) {
      operatingHours.monday = { open: openTime, close: closeTime };
      operatingHours.tuesday = { open: openTime, close: closeTime };
      operatingHours.wednesday = { open: openTime, close: closeTime };
      operatingHours.thursday = { open: openTime, close: closeTime };
      operatingHours.friday = { open: openTime, close: closeTime };
      operatingHours.saturday = { open: openTime, close: closeTime };
      operatingHours.sunday = { open: openTime, close: closeTime };
    }
    
    return operatingHours;
  };

  // Register complete mutation
  const mutation = useMutation<
    RegisterCompleteResponse,
    AxiosError<{ message: string }>,
    { payload: RegisterCompletePayload; images?: any }
  >({
    mutationFn: ({ payload, images }) => registerComplete(payload, images),
    onSuccess: data => {
      console.log('Register complete API response:', data.message);
      showSuccessToast(data?.message || 'Registration completed successfully!');
      // Clear vendor verification data after successful registration
      clearAll();
      setLoggedIn(true);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      console.log('Register complete API error:', msg);
      showErrorToast(msg);
    },
  });

  const handleSubmit = () => {
    const data = { vendor, shop, bank };
    if (!validateStep(3, data)) return;

    // Parse operating hours
    const operatingHours = parseOperatingHours();

    // Format contact number
    const formatContactNum = (phone: string) => {
      if (!phone) return '';
      // Remove any non-digit characters
      const digits = phone.replace(/\D/g, '');
      // If it's 10 digits, add country code
      if (digits.length === 10) {
        return `+91${digits}`;
      }
      // If it already has country code, ensure it starts with +
      if (digits.length > 10 && !phone.startsWith('+')) {
        return `+${digits}`;
      }
      return phone.startsWith('+') ? phone : `+${phone}`;
    };

    // Transform data to match API payload structure
    const payload: RegisterCompletePayload = {
      shop_name: shop.shop_name,
      owner_name: vendor.owner_name,
      email: vendor.email,
      gst_number: shop.gst_number,
      pan_number: vendor.pan_number,
      shop_license_number: shop.shop_license_number,
      aadhaar_number: vendor.aadhaar_no,
      address_line1: shop.address,
      pincode: shop.pincode,
      landmark: shop.landmark,
      latitude: parseFloat(shop.latitude) || 0,
      longitude: parseFloat(shop.longitude) || 0,
      contactNum: formatContactNum(shop.contact_number || vendor.mobile),
      account_holder_name: bank.account_holder_name,
      account_number: bank.account_number,
      ifsc_code: bank.ifsc_code,
      bank_name: bank.bank_name,
      branch: bank.bank_name, // Using bank_name as branch if branch is not available
      upi_id: bank.upi_id,
      operating_hours: operatingHours,
    };

    // Prepare images - map to API field names
    const images = {
      ...(vendor.profile_pic && { profile_pic: vendor.profile_pic }),
      ...(vendor.aadhaar_file && { aadhaar_card: vendor.aadhaar_file }),
      ...(vendor.pan_file && { pan_card: vendor.pan_file }),
      ...(shop.shop_front_photo && { shop_front_photo: shop.shop_front_photo }),
      ...(bank.cancelled_cheque && { cancelled_cheque: bank.cancelled_cheque }),
    };

    console.log('Submitting data:', payload);
    console.log('Submitting images:', images);
    mutation.mutate({ payload, images });
  };

  const handleEditPersonal = () => {
    navigation.navigate('VendorVerification', { step: 1 });
  };

  const handleEditShop = () => {
    navigation.navigate('VendorVerification', { step: 2 });
  };

  const handleEditBank = () => {
    navigation.navigate('VendorVerification', { step: 3 });
  };
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    return phone.length === 10 ? `91+${phone}` : phone;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <CustomText style={styles.title}>Review Details</CustomText>

      {/* Personal Details Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <CustomText style={styles.sectionTitle}>Personal Details</CustomText>
          <TouchableOpacity onPress={handleEditPersonal} style={styles.editButton}>
            <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />
            <CustomText style={styles.editText}>Edit</CustomText>
          </TouchableOpacity>
        </View>

        <DetailItem label="Full Name" value={vendor.owner_name} />
        <DetailItem label="Number" value={formatPhoneNumber(vendor.mobile)} />
        <DetailItem label="Mail ID" value={vendor.email} />
        {vendor.gender && <DetailItem label="Gender" value={vendor.gender} />}
        <DetailItem label="Date Of Birth" value={vendor.date_of_birth} />
        
        {(vendor.aadhaar_file || vendor.pan_file) && (
          <View style={styles.detailItem}>
            <CustomText style={styles.label}>Government ID (Aadhar & PAN)</CustomText>
            {vendor.aadhaar_file && (
              <View style={styles.fileItem}>
                <CustomText style={styles.fileName}>
                  {vendor.aadhaar_file.name || 'Aadhaar Document'}
                </CustomText>
              </View>
            )}
            {vendor.pan_file && (
              <View style={styles.fileItem}>
                <CustomText style={styles.fileName}>
                  {vendor.pan_file.name || 'PAN Document'}
                </CustomText>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Shop Details Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <CustomText style={styles.sectionTitle}>Shop Details</CustomText>
          <TouchableOpacity onPress={handleEditShop} style={styles.editButton}>
            <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />
            <CustomText style={styles.editText}>Edit</CustomText>
          </TouchableOpacity>
        </View>

        <DetailItem label="Shop Name" value={shop.shop_name} />
        <DetailItem label="GST Number" value={shop.gst_number} />
        <DetailItem label="Shop Address" value={shop.address} />
        <DetailItem label="Pincode" value={shop.pincode} />
        <DetailItem label="Landmark" value={shop.landmark} />
        <DetailItem label="Business Hours" value={shop.business_hours} />
        <DetailItem label="Contact Number" value={formatPhoneNumber(shop.contact_number)} />
        {shop.shop_front_photo && (
          <DetailItem label="Shop Front Photo" value={shop.shop_front_photo.name} isFile />
        )}
      </View>

      {/* Bank Details Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <CustomText style={styles.sectionTitle}>Bank Details</CustomText>
          <TouchableOpacity onPress={handleEditBank} style={styles.editButton}>
            <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />
            <CustomText style={styles.editText}>Edit</CustomText>
          </TouchableOpacity>
        </View>

        <DetailItem label="Account Holder Name" value={bank.account_holder_name} />
        <DetailItem label="Account Number*" value={bank.account_number || '-'} />
        <DetailItem label="Bank Name" value={bank.bank_name} />
        <DetailItem label="IFSC Code" value={bank.ifsc_code} />
        <DetailItem label="UPI ID" value={bank.upi_id} />
        {bank.cancelled_cheque && (
          <DetailItem label="Cancelled Cheque" value={bank.cancelled_cheque.name} isFile />
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <CustomBtn
          title="Previous"
          onPress={() => navigation.goBack()}
          style={styles.previousButton}
          textStyle={styles.previousButtonText}
        />
        <CustomBtn
          title="Save"
          onPress={handleSubmit}
          disabled={mutation.isPending}
          loading={mutation.isPending}
          style={styles.nextButton}
          textStyle={styles.nextButtonText}
        />
      </View>
    </ScrollView>
  );
};

export default ReviewDetailsScreen;

