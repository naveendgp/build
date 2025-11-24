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
import { ShopDocumentUploadPayload } from '../../../apiService/types/authTypes';
import { showErrorToast } from '../../../utils/Toast';
import { useAuthStore } from '../../../apiService/store/useAuthStore';
import { useVendorValidation } from '../useVendorValidation';
import { useSubmitVerification } from './hooks/useSubmitVerification';

type ReviewDetailsNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'ReviewDetails'
>;

const ReviewDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ReviewDetailsNavProp>();
  const setLoggedIn = useAuthStore(state => state.setIsLoggedIn);
  const { validateStep } = useVendorValidation();

  // Get data from store
  const { vendor, shop, bank, services, clearAll } = useVendorVerificationStore();

  // Custom hook for handling both API calls
  const {
    submitBoth,
    retryDocumentUpload,
    retryServicesToggle,
    isLoading,
    bothSuccess,
    apiStatus,
    documentError,
    servicesError,
    documentSuccess,
    servicesSuccess,
  } = useSubmitVerification({
    onSuccess: () => {
      clearAll();
      setLoggedIn(true);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    },
  });

  const handleSubmit = () => {
    const data = { vendor, shop, bank, services };
    if (!validateStep(3, data)) return;

    // Transform data to match ShopDocumentUploadPayload structure
    const documentPayload: ShopDocumentUploadPayload = {
      shop_name: shop.shop_name,
      owner_name: vendor.owner_name,
      email: vendor.email,
      gst_number: shop.gst_number,
      pan_number: vendor.pan_number,
      shop_license_number: shop.shop_license_number,
      address_line1: shop.address,
      address_line2: shop.landmark || '',
      city: shop.city || '',
      state: shop.state || '',
      pincode: shop.pincode,
      landmark: shop.landmark || '',
      latitude: parseFloat(shop.latitude) || 0,
      longitude: parseFloat(shop.longitude) || 0,
      account_holder_name: bank.account_holder_name,
      account_number: bank.account_number,
      ifsc_code: bank.ifsc_code,
      bank_name: bank.bank_name,
      aadhaar_number: vendor.aadhaar_no,
    };

    // Submit both APIs simultaneously
    submitBoth(documentPayload, services.selectedServices);
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

  const handleEditServices = () => {
    navigation.navigate('VendorVerification', { step: 4 });
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

      {/* Services Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <CustomText style={styles.sectionTitle}>Selected Services</CustomText>
          <TouchableOpacity onPress={handleEditServices} style={styles.editButton}>
            <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />
            <CustomText style={styles.editText}>Edit</CustomText>
          </TouchableOpacity>
        </View>

        {services.selectedServices.length > 0 ? (
          <View style={styles.detailItem}>
            <View style={{ marginTop: 4 }}>
              {services.selectedServices.map((serviceName, index) => (
                <CustomText key={index} style={[styles.value, { marginTop: index > 0 ? 4 : 0 }]}>
                  {serviceName}
                </CustomText>
              ))}
            </View>
          </View>
        ) : (
          <DetailItem label="Selected Services" value="No services selected" />
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
          disabled={isLoading || bothSuccess}
          loading={isLoading}
          style={styles.nextButton}
          textStyle={styles.nextButtonText}
        />
      </View>

      {/* Retry buttons for failed APIs */}
      {(documentError || servicesError) && (
        <View style={styles.buttonRow}>
          {documentError && !documentSuccess && (
            <CustomBtn
              title="Retry Document Upload"
              onPress={() => {
                const documentPayload: ShopDocumentUploadPayload = {
                  shop_name: shop.shop_name,
                  owner_name: vendor.owner_name,
                  email: vendor.email,
                  gst_number: shop.gst_number,
                  pan_number: vendor.pan_number,
                  shop_license_number: shop.shop_license_number,
                  address_line1: shop.address,
                  address_line2: shop.landmark || '',
                  city: shop.city || '',
                  state: shop.state || '',
                  pincode: shop.pincode,
                  landmark: shop.landmark || '',
                  latitude: parseFloat(shop.latitude) || 0,
                  longitude: parseFloat(shop.longitude) || 0,
                  account_holder_name: bank.account_holder_name,
                  account_number: bank.account_number,
                  ifsc_code: bank.ifsc_code,
                  bank_name: bank.bank_name,
                  aadhaar_number: vendor.aadhaar_no,
                };
                retryDocumentUpload(documentPayload);
              }}
              disabled={isLoading}
              style={styles.previousButton}
              textStyle={styles.previousButtonText}
            />
          )}
          {servicesError && !servicesSuccess && (
            <CustomBtn
              title="Retry Services Update"
              onPress={() => retryServicesToggle(services.selectedServices)}
              disabled={isLoading}
              style={styles.previousButton}
              textStyle={styles.previousButtonText}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default ReviewDetailsScreen;

