import React, { useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../apiService/store/useAuthStore';
import VendorDetailsStep from './VendorDetailsStep';
import ShopDetailsStep from './ShopDetailsStep';
import BankDetailsStep from './BankDetailsStep';
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

type VendorNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'VendorVerification'
>;

const VendorVerificationScreen: React.FC = () => {
  const navigation = useNavigation<VendorNavProp>();
  const setLoggedIn = useAuthStore(state => state.setIsLoggedIn);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [step, setStep] = useState(1);

  const [data, setData] = useState({
    vendor: {
      owner_name: '',
      email: '',
      address: '',
      aadhaar_no: '',
      pan_number: '',
    },
    shop: {
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
    },
    bank: {
      account_number: '',
      account_holder_name: '',
      bank_branch: '',
      ifsc_code: '',
      bank_name: '',
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
    if (validateStep(step, data)) {
      setStep(prev => prev + 1);
      setCurrentStep(prev => prev + 1);
    }
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
      branch: data.bank.bank_branch,
    };

    console.log('Submitting data:', payload);

    mutation.mutate(payload);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F6F9FF',
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Toolbar title="Vendor Verification" />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20 }}
          >
            <View style={styles.stepIndicatorRow}>
              {[1, 2, 3].map((stepNum, idx, arr) => {
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
                      {active && <View style={styles.dot} />}
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

            {step === 1 && (
              <VendorDetailsStep
                vendor={data.vendor}
                setVendor={val => setData(d => ({ ...d, vendor: val }))}
                handleFocusScroll={() => {}}
                vendorAddressRef={vendorAddressRef}
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

            <CustomBtn
              title={
                step < 3
                  ? 'Next'
                  : mutation.isPending
                  ? 'Submitting...'
                  : 'Submit'
              }
              onPress={step < 3 ? handleNext : handleSubmit}
              disabled={mutation.isPending}
            />
            {step > 1 && (
              <View style={{ marginTop: 10 }}>
                <CustomBtn title="Back" onPress={handleBack} />
              </View>
            )}
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
