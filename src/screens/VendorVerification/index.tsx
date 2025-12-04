import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from './styles';
import CustomBtn from '../../components/CustomBtn';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../apiService/store/useAuthStore';
import { useVendorVerificationStore } from '../../apiService/store/useVendorVerificationStore';
import VendorDetailsStep from './ProfileDetails/VendorDetailsStep';
import ShopDetailsStep from './ShopDetails/ShopDetailsStep';
import BankDetailsStep from './BankDetails/BankDetailsStep';
import ServicesStep from './ServicesStep';
import { useVendorValidation, VendorErrors, ShopErrors, BankErrors } from './useVendorValidation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { RegisterCompletePayload, RegisterCompleteResponse, OperatingHours } from '../../apiService/types/authTypes';
import { AxiosError } from 'axios';
import { showErrorToast, showSuccessToast } from '../../utils/Toast';
import { getMimeTypeFromExtension } from '../../utils/fileUtils';
import { COLORS } from '../../constants';
import CustomText from '../../components/Text';
import { getProfile } from '../../apiService/api/profileApi';
import { VendorProfile } from '../../apiService/types/profileTypes';
import { registerComplete } from '../../apiService/api/authApi';
import DiscardDialog from '../../components/DiscardDialog';

type VendorNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'VendorVerification'
>;

const VendorVerificationScreen: React.FC = () => {
  const navigation = useNavigation<VendorNavProp>();
  const route = useRoute();
  const setLoggedIn = useAuthStore(state => state.setIsLoggedIn);
  const mobileNumber = useAuthStore(state => state.mobileNumber);
  const routeParams = route.params as { step?: number; isReupload?: boolean } | undefined;
  const initialStep = routeParams?.step || 1;
  const isReupload = routeParams?.isReupload || false;

  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [step, setStep] = useState(initialStep);

  // Store methods
  const { vendor: storeVendor, shop: storeShop, bank: storeBank, services: storeServices, setVendorData, setShopData, setBankData, setServicesData, clearAll } = useVendorVerificationStore();

  // State for discard dialog
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Fetch profile data when isReupload is true
  const { data: profileData } = useQuery<VendorProfile>({
    queryKey: ['vendor-profile'],
    queryFn: async () => {
      const response = await getProfile();
      return response.data;
    },
    enabled: isReupload, // Only fetch when isReupload is true
  });

  // Load data from store when navigating to a step
  useEffect(() => {
    if (step === 1 && storeVendor.owner_name) {
      setData(prev => ({ ...prev, vendor: storeVendor }));
    } else if (step === 2 && storeShop.shop_name) {
      setData(prev => ({ ...prev, shop: storeShop }));
    } else if (step === 3 && storeBank.account_holder_name) {
      setData(prev => ({ ...prev, bank: storeBank }));
    } else if (step === 4 && storeServices.selectedServices.length > 0) {
      setData(prev => ({ ...prev, services: storeServices }));
    }
  }, [step, storeVendor, storeShop, storeBank, storeServices]);

  // Set mobile number from auth store when available
  useEffect(() => {
    if (mobileNumber) {
      setData(prev => {
        // Only update if mobile is not already set
        if (!prev.vendor.mobile) {
          return {
            ...prev,
            vendor: { ...prev.vendor, mobile: mobileNumber },
          };
        }
        return prev;
      });
    }
  }, [mobileNumber]);

  // Populate form fields with profile data when isReupload is true
  useEffect(() => {
    if (isReupload && profileData) {
      // Populate vendor details (Step 1)
      setData(prev => ({
        ...prev,
        vendor: {
          owner_name: profileData.owner_name || '',
          email: profileData.email || '',
          address: profileData.address?.address_line1 || '',
          aadhaar_no: profileData.aadhaar_number || '',
          pan_number: profileData.pan_number || '',
          mobile: profileData.phone || mobileNumber || '',
          date_of_birth: '',
          profile_pic: null,
          aadhaar_file: null,
          pan_file: null,
        },
        shop: {
          shop_name: profileData.shop_name || '',
          gst_number: profileData.gst_number || '',
          shop_license_number: profileData.shop_license_number || '',
          address: profileData.address?.address_line1 || '',
          address_line2: profileData.address?.address_line2 || '',
          city: profileData.address?.city || '',
          state: profileData.address?.state || '',
          pincode: profileData.address?.pincode || '',
          shop_time: '',
          landmark: profileData.address?.landmark || '',
          latitude: profileData.address?.latitude?.toString() || '',
          longitude: profileData.address?.longitude?.toString() || '',
          contact_number: '',
          shop_front_photo: null,
          business_hours: profileData.operating_hours ? JSON.stringify(profileData.operating_hours) : '',
          auto_receive_orders: false,
          repeat_days: '',
        },
        bank: {
          account_number: profileData.bank_details?.account_number || '',
          account_holder_name: profileData.bank_details?.account_holder_name || '',
          ifsc_code: profileData.bank_details?.ifsc_code || '',
          bank_name: profileData.bank_details?.bank_name || '',
          upi_id: '',
          cancelled_cheque: null,
        },
        services: {
          selectedServices: profileData.services_offered
            ?.filter(service => service.is_active)
            .map(service => service.service_name) || [],
        },
      }));

      // Update store with profile data
      setVendorData({
        owner_name: profileData.owner_name || '',
        email: profileData.email || '',
        address: profileData.address?.address_line1 || '',
        aadhaar_no: profileData.aadhaar_number || '',
        pan_number: profileData.pan_number || '',
        mobile: profileData.phone || mobileNumber || '',
        date_of_birth: '',
        profile_pic: null,
        aadhaar_file: null,
        pan_file: null,
      });

      setShopData({
        shop_name: profileData.shop_name || '',
        gst_number: profileData.gst_number || '',
        shop_license_number: profileData.shop_license_number || '',
        address: profileData.address?.address_line1 || '',
        address_line2: profileData.address?.address_line2 || '',
        city: profileData.address?.city || '',
        state: profileData.address?.state || '',
        pincode: profileData.address?.pincode || '',
        shop_time: '',
        landmark: profileData.address?.landmark || '',
        latitude: profileData.address?.latitude?.toString() || '',
        longitude: profileData.address?.longitude?.toString() || '',
        contact_number: '',
        shop_front_photo: null,
        business_hours: profileData.operating_hours ? JSON.stringify(profileData.operating_hours) : '',
        auto_receive_orders: false,
        repeat_days: '',
      });

      setBankData({
        account_number: profileData.bank_details?.account_number || '',
        account_holder_name: profileData.bank_details?.account_holder_name || '',
        ifsc_code: profileData.bank_details?.ifsc_code || '',
        bank_name: profileData.bank_details?.bank_name || '',
        upi_id: '',
        cancelled_cheque: null,
      });

      setServicesData({
        selectedServices: profileData.services_offered
          ?.filter(service => service.is_active)
          .map(service => service.service_name) || [],
      });
    }
  }, [isReupload, profileData, mobileNumber, setVendorData, setShopData, setBankData, setServicesData]);

  const [data, setData] = useState({
    vendor: {
      owner_name: '',
      email: '',
      address: '',
      aadhaar_no: '',
      pan_number: '',
      mobile: mobileNumber || '', // Set mobile from auth store if available
      date_of_birth: '',
      profile_pic: null as string | { uri: string; name?: string } | null,
      aadhaar_file: null as { uri: string; name: string } | null,
      pan_file: null as { uri: string; name: string } | null,
    },
    shop: {
      shop_name: '',
      gst_number: '',
      shop_license_number: '',
      address: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      shop_time: '',
      landmark: '',
      latitude: '',
      longitude: '',
      contact_number: '',
      shop_front_photo: null,
      business_hours: '',
      auto_receive_orders: false,
      repeat_days: '',
    },
    bank: {
      account_number: '',
      account_holder_name: '',

      ifsc_code: '',
      bank_name: '',
      upi_id: '',
      cancelled_cheque: null,
    },
    services: {
      selectedServices: [] as string[],
    },
  });

  const scrollRef = useRef<ScrollView | null>(null);
  const vendorAddressRef = useRef(null);

  const { validateStep, validateVendor, validateShop, validateBank, validateServices } = useVendorValidation();
  const [formErrors, setFormErrors] = useState<{
    vendor: VendorErrors;
    shop: ShopErrors;
    bank: BankErrors;
    services: string;
  }>({
    vendor: {},
    shop: {},
    bank: {},
    services: '',
  });

  // Helper function to parse operating hours from business_hours string
  const parseOperatingHours = (businessHours: string): OperatingHours => {
    if (!businessHours) {
      return {};
    }
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(businessHours);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as OperatingHours;
      }
    } catch (e) {
      // If not JSON, return empty object
    }
    return {};
  };

  // Helper function to normalize file object
  const normalizeFile = (file: any, defaultName: string, defaultType: string = 'image/jpeg') => {
    if (!file) return undefined;
    // Handle string URI
    if (typeof file === 'string') {
      return {
        uri: file,
        name: defaultName,
        type: getMimeTypeFromExtension(defaultName),
      };
    }
    // Handle object with uri and name
    if (file?.uri) {
      const fileName = file.name || defaultName;
      // Use provided type, or detect from extension, or use default
      const mimeType = file.type || getMimeTypeFromExtension(fileName) || defaultType;
      return {
        uri: file.uri,
        name: fileName,
        type: mimeType,
      };
    }
    return undefined;
  };

  // Document upload mutation using registerComplete
  const mutation = useMutation<
    RegisterCompleteResponse,
    AxiosError<{ message: string }>,
    RegisterCompletePayload
  >({
    mutationFn: payload => {
      // Convert ShopDocumentUploadPayload to RegisterCompletePayload
      const registerPayload: RegisterCompletePayload = {
        shop_name: payload.shop_name,
        owner_name: payload.owner_name,
        email: payload.email || '',
        gst_number: payload.gst_number,
        pan_number: payload.pan_number,
        shop_license_number: payload.shop_license_number,
        aadhaar_number: payload.aadhaar_number,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2,
        pincode: payload.pincode,
        landmark: payload.landmark,
        latitude: payload.latitude,
        longitude: payload.longitude,
        contactNum: data.shop.contact_number || '',
        account_holder_name: payload.account_holder_name,
        account_number: payload.account_number,
        ifsc_code: payload.ifsc_code,
        bank_name: payload.bank_name,
        branch: '', // Optional field
        upi_id: data.bank.upi_id || '',
        operating_hours: parseOperatingHours(data.shop.business_hours || ''),
      };

      // Prepare images object
      const images = {
        profile_pic: normalizeFile(data.vendor.profile_pic, 'profile_pic.jpg'),
        // Don't force PDF - preserve original format (image or PDF)
        aadhaar_card: normalizeFile(data.vendor.aadhaar_file, 'aadhaar_card.jpg'),
        pan_card: normalizeFile(data.vendor.pan_file, 'pan_card.jpg'),
        shop_image: normalizeFile(data.shop.shop_front_photo, 'shop_image.jpg'),
        cancelled_cheque: normalizeFile(data.bank.cancelled_cheque, 'cancelled_cheque.jpg'),
      };

      return registerComplete(registerPayload, images);
    },
    onSuccess: data => {
      console.log('Document upload API response:', data.message);
      // Update document state from response
      if (data?.status) {
        const { setDocumentState } = useAuthStore.getState();
        setDocumentState(data.data.status);
      }
      showSuccessToast(data?.message || 'Document uploaded successfully!');
      setLoggedIn(true);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    },
    onError: error => {
      const msg = error.response?.data?.message || error.message;
      console.log('Document upload API error:', msg);
      showErrorToast(msg);
    },
  });

  const handleNext = () => {
    // If button is disabled, trigger validation to show errors
    if (isNextButtonDisabled) {
      if (step === 1) {
        const vendorErrors = validateVendor(data.vendor);
        setFormErrors(prev => ({ ...prev, vendor: vendorErrors }));
        // Scroll to top to show errors
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else if (step === 2) {
        const shopErrors = validateShop(data.shop);
        setFormErrors(prev => ({ ...prev, shop: shopErrors }));
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else if (step === 3) {
        const bankErrors = validateBank(data.bank);
        setFormErrors(prev => ({ ...prev, bank: bankErrors }));
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else if (step === 4) {
        const servicesError = validateServices(data.services);
        setFormErrors(prev => ({ ...prev, services: servicesError }));
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    // Normal flow when button is enabled
    if (step === 1) {
      const vendorErrors = validateVendor(data.vendor);
      setFormErrors(prev => ({ ...prev, vendor: vendorErrors }));
      if (Object.values(vendorErrors).some(Boolean)) {
        return;
      }
      setFormErrors(prev => ({ ...prev, vendor: {} }));
      setVendorData(data.vendor);
      setStep(prev => prev + 1);
      setCurrentStep(prev => prev + 1);
    } else if (step === 2) {
      const shopErrors = validateShop(data.shop);
      setFormErrors(prev => ({ ...prev, shop: shopErrors }));
      if (Object.values(shopErrors).some(Boolean)) {
        return;
      }
      setFormErrors(prev => ({ ...prev, shop: {} }));
      setShopData(data.shop);
      setStep(prev => prev + 1);
      setCurrentStep(prev => prev + 1);
    } else if (step === 3) {
      const bankErrors = validateBank(data.bank);
      setFormErrors(prev => ({ ...prev, bank: bankErrors }));
      if (Object.values(bankErrors).some(Boolean)) {
        return;
      }
      setFormErrors(prev => ({ ...prev, bank: {} }));
      setBankData(data.bank);
      setStep(prev => prev + 1);
      setCurrentStep(prev => prev + 1);
    } else if (step === 4) {
      const servicesError = validateServices(data.services);
      setFormErrors(prev => ({ ...prev, services: servicesError }));
      if (servicesError) {
        return;
      }
      setServicesData(data.services);
      // Navigate to ReviewDetails screen after step 4
      navigation.navigate('ReviewDetails');
    }
  };

  const handleBack = () => {
    // If on step 1, show discard dialog
    if (step === 1) {
      setShowDiscardDialog(true);
      return;
    }
    // Otherwise, go back one step
    setStep(prev => Math.max(prev - 1, 1));
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleConfirmDiscard = () => {
    // Clear all vendor verification data from store
    clearAll();
    // Reset local form data
    setData({
      vendor: {
        owner_name: '',
        email: '',
        address: '',
        aadhaar_no: '',
        pan_number: '',
        mobile: mobileNumber || '',
        date_of_birth: '',
        profile_pic: null,
        aadhaar_file: null,
        pan_file: null,
      },
      shop: {
        shop_name: '',
        gst_number: '',
        shop_license_number: '',
        address: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        shop_time: '',
        landmark: '',
        latitude: '',
        longitude: '',
        contact_number: '',
        shop_front_photo: null,
        business_hours: '',
        auto_receive_orders: false,
        repeat_days: '',
      },
      bank: {
        account_number: '',
        account_holder_name: '',
        ifsc_code: '',
        bank_name: '',
        upi_id: '',
        cancelled_cheque: null,
      },
      services: {
        selectedServices: [],
      },
    });
    // Reset form errors
    setFormErrors({
      vendor: {},
      shop: {},
      bank: {},
      services: '',
    });
    setShowDiscardDialog(false);
    // Navigate back
    // navigation.goBack();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleCancelDiscard = () => {
    setShowDiscardDialog(false);
  };

  // Handle back button/gesture navigation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If on step 2, 3, or 4, go back one step
        if (step > 1) {
          setStep(prev => Math.max(prev - 1, 1));
          setCurrentStep(prev => Math.max(prev - 1, 1));
          return true; // Prevent default back action
        }
        // If on step 1, show discard dialog
        if (step === 1) {
          setShowDiscardDialog(true);
          return true; // Prevent default back action
        }
        return false;
      };

      // Add event listener
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Cleanup
      return () => backHandler.remove();
    }, [step])
  );

  // Functions to clear specific field errors when user starts typing
  const clearVendorError = (field: keyof VendorErrors) => {
    setFormErrors(prev => ({
      ...prev,
      vendor: { ...prev.vendor, [field]: undefined },
    }));
  };

  const clearShopError = (field: keyof ShopErrors) => {
    setFormErrors(prev => ({
      ...prev,
      shop: { ...prev.shop, [field]: undefined },
    }));
  };

  const clearBankError = (field: keyof BankErrors) => {
    setFormErrors(prev => ({
      ...prev,
      bank: { ...prev.bank, [field]: undefined },
    }));
  };

  // Helper functions to check if mandatory fields are filled (without full validation)
  const isVendorStepValid = useCallback(() => {
    const vendor = data.vendor;
    const hasOwnerName = vendor.owner_name?.trim();
    const hasMobile = vendor.mobile?.trim() && /^\d{10}$/.test(vendor.mobile.trim());
    const hasDocument = !!(vendor.aadhaar_file || vendor.pan_file);

    return hasOwnerName && hasMobile && hasDocument;
  }, [data.vendor]);

  const isShopStepValid = useCallback(() => {
    const shop = data.shop;
    const hasShopName = shop.shop_name?.trim();
    const hasAddress = shop.address?.trim();
    const hasContactNumber = shop.contact_number?.trim() && /^\d{10}$/.test(shop.contact_number.trim());
    const hasShopPhoto = shop.shop_front_photo;
    const hasBusinessHours = shop.business_hours?.trim();

    return hasShopName && hasAddress && hasContactNumber && hasShopPhoto && hasBusinessHours;
  }, [data.shop]);

  const isBankStepValid = useCallback(() => {
    const bank = data.bank;
    // Check mandatory fields: account_holder_name, account_number, bank_name, ifsc_code, cancelled_cheque
    const hasAccountHolderName = bank.account_holder_name?.trim();
    const accountNumber = bank.account_number?.trim();
    const hasAccountNumber = accountNumber && /^\d{9,18}$/.test(accountNumber);
    const hasBankName = bank.bank_name?.trim();
    const ifscCode = bank.ifsc_code?.trim();
    const hasIfscCode = ifscCode && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode);
    const hasCancelledCheque = bank.cancelled_cheque;

    return hasAccountHolderName && hasAccountNumber && hasBankName && hasIfscCode && hasCancelledCheque;
  }, [data.bank]);

  const isServicesStepValid = useCallback(() => {
    // Check if at least one service is selected
    return data.services.selectedServices.length > 0;
  }, [data.services.selectedServices]);

  // Determine if Next button should be disabled based on current step
  const isNextButtonDisabled = useMemo(() => {
    if (mutation.isPending) return true;

    switch (step) {
      case 1:
        return !isVendorStepValid();
      case 2:
        return !isShopStepValid();
      case 3:
        return !isBankStepValid();
      case 4:
        return !isServicesStepValid();
      default:
        return false;
    }
  }, [step, isVendorStepValid, isShopStepValid, isBankStepValid, isServicesStepValid, mutation.isPending]);


  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.WHITE,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        <View style={{ paddingHorizontal: 12, gap: 24, marginTop: 24 }}>


          <CustomText style={styles.stepIndicatorText}>{step === 1 ? "Profile Details" : step === 2 ? "Shop Details" : step === 3 ? "Bank Details" : "Services"}</CustomText>
          <View style={styles.stepIndicatorRow}>
            {[1, 2, 3, 4].map((stepNum, idx, arr) => {
              const completed = stepNum < currentStep;
              const active = stepNum === currentStep;
              return (
                <React.Fragment key={stepNum}>
                  <TouchableOpacity
                    onPress={() => {
                      if (completed || active) {
                        setStep(stepNum);
                        setCurrentStep(stepNum);
                      }
                    }}
                    style={[
                      styles.stepIndicator,
                      active && styles.stepIndicatorActive,
                      completed && styles.stepIndicatorCompleted,
                    ]}
                  >
                    {<View style={[styles.dot, (active || completed) && styles.activeDot]} />}
                  </TouchableOpacity>

                  {idx < arr.length - 1 && (
                    <View
                      style={[
                        styles.connector,
                        stepNum < currentStep && styles.connectorCompleted,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={step === 4 ? { paddingHorizontal: 12, paddingBottom: 20 } : { padding: 20 }}
          >


            {step === 1 && (
              <VendorDetailsStep
                vendor={data.vendor}
                setVendor={val => setData(d => ({ ...d, vendor: val }))}
                handleFocusScroll={() => { }}
                vendorAddressRef={vendorAddressRef}
                isMobileFromOtp={!!mobileNumber}
                errors={formErrors.vendor}
                clearError={clearVendorError}
              />
            )}
            {step === 2 && (
              <ShopDetailsStep
                shop={data.shop}
                setShop={val => setData(d => ({ ...d, shop: val }))}
                errors={formErrors.shop}
                clearError={clearShopError}
              />
            )}
            {step === 3 && (
              <BankDetailsStep
                bank={data.bank}
                setBank={val => setData(d => ({ ...d, bank: val }))}
                errors={formErrors.bank}
                clearError={clearBankError}
              />
            )}
            {step === 4 && (
              <ServicesStep
                selectedServices={data.services.selectedServices}
                setSelectedServices={(val: string[]) => {
                  setData(d => ({ ...d, services: { ...d.services, selectedServices: val } }));
                }}
                error={formErrors.services}
                isReupload={isReupload}
              />
            )}

            <View style={styles.buttonRow}>
              {step > 1 && (
                <CustomBtn
                  title="Previous"
                  onPress={handleBack}
                  style={styles.previousButton}
                  textStyle={styles.previousButtonText}
                />
              )}
              <CustomBtn
                title="Next"
                onPress={handleNext}
                disabled={mutation.isPending} // Only disable when mutation is pending
                style={[
                  step === 1 ? { ...styles.nextButton, ...styles.nextButtonFullWidth } : styles.nextButton,
                  isNextButtonDisabled && styles.nextButtonDisabled, // Visual indication only
                ] as any}
                textStyle={styles.nextButtonText}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {mutation.isPending && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Discard Dialog for step 1 back navigation */}
      <DiscardDialog
        visible={showDiscardDialog}
        title="Discard Changes?"
        subtitle="Are you sure you want to go back? All entered data will be cleared."
        primaryButtonText="Discard"
        secondaryButtonText="Cancel"
        onPrimaryButtonPress={handleConfirmDiscard}
        onSecondaryButtonPress={handleCancelDiscard}
        onClose={handleCancelDiscard}
        closable={true}
      />
    </SafeAreaView>
  );
};

export default VendorVerificationScreen;
