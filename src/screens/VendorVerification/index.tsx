import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
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
import ReviewDetailsScreen from './ReviewDetails';
import { useVendorValidation } from './useVendorValidation';
import Toolbar from '../../components/Toolbar';
import { useMutation } from '@tanstack/react-query';
import { documentUploadApi } from '../../apiService/api/documentApi';
import {
  ShopDocumentUploadPayload,
  ShopDocumentUploadResponse,
} from '../../apiService/types/docTypes';
import { AxiosError } from 'axios';
import { showErrorToast, showSuccessToast } from '../../utils/Toast';
import { COLORS } from '../../constants';
import CustomText from '../../components/Text';

type VendorNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'VendorVerification'
>;

const VendorVerificationScreen: React.FC = () => {
  const navigation = useNavigation<VendorNavProp>();
  const route = useRoute();
  const setLoggedIn = useAuthStore(state => state.setIsLoggedIn);
  const mobileNumber = useAuthStore(state => state.mobileNumber);
  const routeParams = route.params as { step?: number } | undefined;
  const initialStep = routeParams?.step || 1;

  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [step, setStep] = useState(initialStep);

  // Store methods
  const { vendor: storeVendor, shop: storeShop, bank: storeBank, services: storeServices, setVendorData, setShopData, setBankData, setServicesData } = useVendorVerificationStore();

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

  const [data, setData] = useState({
    vendor: {
      owner_name: '',
      email: '',
      address: '',
      aadhaar_no: '',
      pan_number: '',
      mobile: mobileNumber || '', // Set mobile from auth store if available
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
  const pincodeRef = useRef(null);

  const { validateStep } = useVendorValidation();

  // Document upload mutation
  const mutation = useMutation<
    ShopDocumentUploadResponse,
    AxiosError<{ message: string }>,
    ShopDocumentUploadPayload
  >({
    mutationFn: payload => documentUploadApi(payload),
    onSuccess: data => {
      console.log('Document upload API response:', data.message);
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
    // if (validateStep(step, data)) {
    // Save current step data to store before moving to next step
    if (step === 1) {
      setVendorData(data.vendor);
      setStep(prev => prev + 1);
      setCurrentStep(prev => prev + 1);
    } else if (step === 2) {
      setShopData(data.shop);
      setStep(prev => prev + 1);
      setCurrentStep(prev => prev + 1);
    } else if (step === 3) {
      setBankData(data.bank);
      setStep(prev => prev + 1);
      setCurrentStep(prev => prev + 1);
    } else if (step === 4) {
      setServicesData(data.services);
      // Navigate to ReviewDetails screen after step 4
      navigation.navigate('ReviewDetails');
    }
    //  }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!validateStep(step, data)) return;

    // Transform data to match API payload structure
    const payload: ShopDocumentUploadPayload = {
      shop_name: data.shop.shop_license_number, // Using shop license as shop name for now
      owner_name: data.vendor.owner_name,
      email: data.vendor.email,
      gst_number: data.shop.gst_number,
      pan_number: data.vendor.pan_number,
      shop_license_number: data.shop.shop_license_number,
      address_line1: data.shop.address,
      address_line2: data.shop.landmark,
      city: data.shop.city,
      state: data.shop.state,
      pincode: data.shop.pincode,
      landmark: data.shop.landmark,
      latitude: parseFloat(data.shop.latitude) || 0,
      longitude: parseFloat(data.shop.longitude) || 0,
      account_holder_name: data.bank.account_holder_name,
      account_number: data.bank.account_number,
      ifsc_code: data.bank.ifsc_code,
      bank_name: data.bank.bank_name,
      aadhaar_number: data.vendor.aadhaar_no,

    };

    console.log('Submitting data:', payload);

    mutation.mutate(payload);
  };

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
              />
            )}
            {step === 2 && (
              <ShopDetailsStep
                shop={data.shop}
                setShop={val => setData(d => ({ ...d, shop: val }))}
              />
            )}
            {step === 3 && (
              <BankDetailsStep
                bank={data.bank}
                setBank={val => setData(d => ({ ...d, bank: val }))}
              />
            )}
            {step === 4 && (
              <ServicesStep
                selectedServices={data.services.selectedServices}
                setSelectedServices={(val: string[]) => {
                  setData(d => ({ ...d, services: { ...d.services, selectedServices: val } }));
                }}
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
                disabled={mutation.isPending}
                style={step === 1 ? { ...styles.nextButton, ...styles.nextButtonFullWidth } : styles.nextButton}
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
    </SafeAreaView>
  );
};

export default VendorVerificationScreen;
