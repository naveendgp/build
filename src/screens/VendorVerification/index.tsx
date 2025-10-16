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
      phone: '',
      email: '',
      address: '',
      profile_pic: '',
      aadhaar_no: '',
    },
    shop: {
      gst_number: '',
      shop_license_number: '',
      address: '',
      shop_time: '',
      landmark: '',
    },
    bank: {
      account_number: '',
      account_holder_name: '',
      bank_branch: '',
      ifsc_code: '',
    },
  });

  const scrollRef = useRef<ScrollView | null>(null);
  const vendorAddressRef = useRef(null);
  const pincodeRef = useRef(null);

  const { validateStep } = useVendorValidation();

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
    // Submit all data via API
    console.log('Submitting data:', data);
    setLoggedIn(true);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F6F9FF',
        paddingTop: StatusBar.currentHeight,
        paddingBottom: StatusBar.currentHeight,
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
                handleFocusScroll={() => {}}
                pincodeRef={pincodeRef}
              />
            )}
            {step === 3 && (
              <BankDetailsStep
                bank={data.bank}
                setBank={val => setData(d => ({ ...d, bank: val }))}
              />
            )}

            <CustomBtn
              title={step < 3 ? 'Next' : 'Submit'}
              onPress={step < 3 ? handleNext : handleSubmit}
            />
            {step > 1 && (
              <View style={{ marginTop: 10 }}>
                <CustomBtn title="Back" onPress={handleBack} />
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VendorVerificationScreen;
