import React, { useState, useRef } from 'react';
import {
  View,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import styles from './styles';
import CustomText from '../../components/Text';
import CustomBtn from '../../components/CustomBtn';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../apiService/store/useAuthStore';
import VendorDetailsStep from './VendorDetailsStep';
import ShopDetailsStep from './ShopDetailsStep';
import BankDetailsStep from './BankDetailsStep';

type VendorNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'VendorVerification'
>;

const VendorVerificationScreen: React.FC = () => {
  const navigation = useNavigation<VendorNavProp>();
  const setLoggedIn = useAuthStore(state => state.setIsLoggedIn);
  // const [currentStep, setCurrentStep] = useState<number>(1);

  const [step, setStep] = useState<number>(1);

  const [vendorDetails, setVendorDetails] = useState({
    owner_name: '',
    phone: '',
    email: '',
    address: '',
    profile_pic: '',
    aadhaar_no: '',
  });

  const [shopDetails, setShopDetails] = useState({
    gst_number: '',
    shop_license_number: '',
    address: '',
    shop_time: '',
    landmark: '',
  });

  const [bankDetails, setBankDetails] = useState({
    account_number: '',
    account_holder_name: '',
    bank_branch: '',
    ifsc_code: '',
  });

  const scrollRef = useRef<ScrollView | null>(null);
  const vendorAddressRef = useRef<View | null>(null);
  const pincodeRef = useRef<View | null>(null);

  const handleFocusScroll = (ref: any) => {
    setTimeout(() => {
      if (ref?.current && scrollRef?.current && ref.current.measure) {
        ref.current.measure(
          (
            fx: number,
            fy: number,
            w: number,
            h: number,
            px: number,
            py: number,
          ) => {
            // reduce offset to avoid over-scrolling
            scrollRef.current?.scrollTo({ y: py - 10, animated: true });
          },
        );
      }
    }, 60);
  };

  const pickProfilePic = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };
  };

  const validateVendor = () => {
    if (!vendorDetails.owner_name.trim()) {
      Alert.alert('Required', 'Owner name is required');
      return false;
    }
    if (!/^[0-9]{10}$/.test(vendorDetails.phone)) {
      Alert.alert('Invalid', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!/^[0-9]{12}$/.test(vendorDetails.aadhaar_no)) {
      Alert.alert('Invalid', 'Please enter a valid 12-digit Aadhaar number');
      return false;
    }
    if (!vendorDetails.address.trim()) {
      Alert.alert('Required', 'Address is required');
      return false;
    }
    return true;
  };

  const validateShop = () => {
    if (!shopDetails.address.trim()) {
      Alert.alert('Required', 'Address is required');
      return false;
    }
    if (!shopDetails.gst_number.trim()) {
      Alert.alert('Required', 'GST is required');
      return false;
    }
    if (!shopDetails.shop_time.trim()) {
      Alert.alert('Required', 'SHOP TIME is required');
      return false;
    }

    return true;
  };

  const validateBank = () => {
    if (!bankDetails.account_number.trim()) {
      Alert.alert('Required', 'Account number is required');
      return false;
    }
    if (!bankDetails.bank_branch.trim()) {
      Alert.alert('Required', 'Bank branch is required');
      return false;
    }
    if (!bankDetails.ifsc_code.trim()) {
      Alert.alert('Required', 'IFSC code is required');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (
      step === 1
      //  && validateVendor()
    ) {
      setStep(2);
    } else if (
      step === 2
      //  && validateShop()
    ) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (!validateBank()) return;
    // TODO: Submit vendorDetails, shopDetails, and bankDetails to backend
    setLoggedIn(true);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F6F9FF',
        paddingTop: StatusBar.currentHeight,
        paddingBlock: StatusBar.currentHeight,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <ScrollView
            ref={r => {
              scrollRef.current = r;
            }}
            contentContainerStyle={{
              paddingBottom: 10,
              justifyContent: 'flex-start',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ padding: 20, flexShrink: 1 }}>
              <View style={styles.stepIndicatorRow}>
                {[1, 2, 3].map((stepNum, idx, arr) => {
                  const completed = stepNum < step;
                  const active = stepNum === step;
                  return (
                    <React.Fragment key={stepNum}>
                      <TouchableOpacity
                        onPress={() => {
                          if (completed) setStep(stepNum);
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
                            stepNum < step && styles.connectorCompleted,
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              <CustomText style={styles.title}>Vendor verification</CustomText>
              <CustomText style={styles.subtitle}>
                Please complete your vendor verification.
              </CustomText>

              {step === 1 && (
                <View>
                  <VendorDetailsStep
                    vendorDetails={vendorDetails}
                    setVendorDetails={setVendorDetails}
                    handleFocusScroll={handleFocusScroll}
                    vendorAddressRef={vendorAddressRef}
                  />
                  <View style={{ marginTop: 14 }}>
                    <CustomBtn title="Next" onPress={handleNext} />
                  </View>
                </View>
              )}

              {step === 2 && (
                <View>
                  <ShopDetailsStep
                    shopDetails={shopDetails}
                    setShopDetails={setShopDetails}
                    handleFocusScroll={handleFocusScroll}
                    pincodeRef={pincodeRef}
                  />
                  <View style={{ marginTop: 14 }}>
                    <CustomBtn title="Next" onPress={handleNext} />
                    <View style={{ height: 8 }} />
                    <CustomBtn title="Back" onPress={handleBack} />
                  </View>
                </View>
              )}

              {step === 3 && (
                <View>
                  <BankDetailsStep
                    bankDetails={bankDetails}
                    setBankDetails={setBankDetails}
                  />
                  <View style={{ marginTop: 14 }}>
                    <CustomBtn
                      title="Submit verification"
                      onPress={handleComplete}
                    />
                    <View style={{ height: 8 }} />
                    <CustomBtn title="Back" onPress={handleBack} />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VendorVerificationScreen;
