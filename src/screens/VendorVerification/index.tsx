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
import { useUserStore } from '../../store/useStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import CustomTextInput from '../../components/TextInput';

type VendorNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'VendorVerification'
>;

const VendorVerificationScreen: React.FC = () => {
  const navigation = useNavigation<VendorNavProp>();
  const setLoggedIn = useUserStore(state => state.setLoggedIn);

  const [step, setStep] = useState<number>(1);

  const [vendorDetails, setVendorDetails] = useState({
    owner_name: '',
    phone: '',
    email: '',
    shop_name: '',
  });

  const [shopDetails, setShopDetails] = useState({
    gst_number: '',
    pan_number: '',
    shop_license_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  const scrollRef = useRef<ScrollView | null>(null);
  const shopNameRef = useRef<View | null>(null);
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

  const validateVendor = () => {
    if (!vendorDetails.owner_name.trim()) {
      Alert.alert('Required', 'Owner name is required');
      return false;
    }
    if (!/^[0-9]{10}$/.test(vendorDetails.phone)) {
      Alert.alert('Invalid', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!vendorDetails.shop_name.trim()) {
      Alert.alert('Required', 'Shop name is required');
      return false;
    }
    return true;
  };

  const validateShop = () => {
    if (!shopDetails.address.trim()) {
      Alert.alert('Required', 'Address is required');
      return false;
    }
    if (!shopDetails.city.trim()) {
      Alert.alert('Required', 'City is required');
      return false;
    }
    if (!shopDetails.state.trim()) {
      Alert.alert('Required', 'State is required');
      return false;
    }
    if (!/^[0-9]{6}$/.test(shopDetails.pincode)) {
      Alert.alert('Invalid', 'Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateVendor()) {
      setStep(2);
    }
  };

  const handleComplete = () => {
    if (!validateShop()) return;
    // TODO: Submit vendorDetails and shopDetails to backend
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
                {[1, 2].map((s, idx, arr) => {
                  const completed = s < step;
                  const active = s === step;
                  return (
                    <React.Fragment key={s}>
                      <TouchableOpacity
                        onPress={() => {
                          if (s < step) setStep(s);
                          if (s > step) {
                            // user tries to jump forward; only allow if current step valid
                            if (step === 1 && validateVendor()) setStep(s);
                          }
                        }}
                        style={[
                          styles.stepIndicator,
                          active && styles.stepIndicatorActive,
                          completed && styles.stepIndicatorCompleted,
                        ]}
                      >
                        <CustomText style={styles.stepIndicatorText}>
                          {s}
                        </CustomText>
                      </TouchableOpacity>

                      {idx < arr.length - 1 && (
                        <View
                          style={[
                            styles.connector,
                            s < step && styles.connectorCompleted,
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
                <View style={{ marginTop: 18 }}>
                  <CustomTextInput
                    label="Owner name"
                    placeholder="Enter owner name"
                    value={vendorDetails.owner_name}
                    onChangeText={val =>
                      setVendorDetails(d => ({ ...d, owner_name: val }))
                    }
                  />

                  <CustomTextInput
                    label="Phone"
                    placeholder="Enter phone"
                    keyboardType="number-pad"
                    value={vendorDetails.phone}
                    maxLength={10}
                    onChangeText={val =>
                      setVendorDetails(d => ({ ...d, phone: val }))
                    }
                  />

                  <CustomTextInput
                    label="Email (optional)"
                    placeholder="Enter email"
                    keyboardType="email-address"
                    value={vendorDetails.email}
                    onChangeText={val =>
                      setVendorDetails(d => ({ ...d, email: val }))
                    }
                  />

                  <View ref={shopNameRef as any}>
                    <CustomTextInput
                      label="Shop name"
                      placeholder="Enter shop name"
                      value={vendorDetails.shop_name}
                      onFocus={() => handleFocusScroll(shopNameRef)}
                      onChangeText={val =>
                        setVendorDetails(d => ({ ...d, shop_name: val }))
                      }
                    />
                  </View>

                  <View style={{ marginTop: 14 }}>
                    <CustomBtn title="Next" onPress={handleNext} />
                  </View>
                </View>
              )}

              {step === 2 && (
                <View style={{ marginTop: 18 }}>
                  <CustomTextInput
                    label="GST Number"
                    placeholder="Enter GST number"
                    value={shopDetails.gst_number}
                    onChangeText={val =>
                      setShopDetails(s => ({ ...s, gst_number: val }))
                    }
                  />

                  <CustomTextInput
                    label="PAN Number"
                    placeholder="Enter PAN number"
                    value={shopDetails.pan_number}
                    onChangeText={val =>
                      setShopDetails(s => ({ ...s, pan_number: val }))
                    }
                  />

                  <CustomTextInput
                    label="Shop License Number"
                    placeholder="Enter license number"
                    value={shopDetails.shop_license_number}
                    onChangeText={val =>
                      setShopDetails(s => ({ ...s, shop_license_number: val }))
                    }
                  />

                  <CustomTextInput
                    label="Address"
                    placeholder="Enter address"
                    value={shopDetails.address}
                    onChangeText={val =>
                      setShopDetails(s => ({ ...s, address: val }))
                    }
                  />

                  <CustomTextInput
                    label="City"
                    placeholder="Enter city"
                    value={shopDetails.city}
                    onChangeText={val =>
                      setShopDetails(s => ({ ...s, city: val }))
                    }
                  />

                  <CustomTextInput
                    label="State"
                    placeholder="Enter state"
                    value={shopDetails.state}
                    onChangeText={val =>
                      setShopDetails(s => ({ ...s, state: val }))
                    }
                  />

                  <View ref={pincodeRef as any}>
                    <CustomTextInput
                      label="Pincode"
                      placeholder="Enter pincode"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={shopDetails.pincode}
                      onFocus={() => handleFocusScroll(pincodeRef)}
                      onChangeText={val =>
                        setShopDetails(s => ({ ...s, pincode: val }))
                      }
                    />
                  </View>

                  <CustomTextInput
                    label="Landmark"
                    placeholder="Enter landmark"
                    value={shopDetails.landmark}
                    onChangeText={val =>
                      setShopDetails(s => ({ ...s, landmark: val }))
                    }
                  />

                  <View style={{ marginTop: 14 }}>
                    <CustomBtn
                      title="Submit verification"
                      onPress={handleComplete}
                    />
                    <View style={{ height: 8 }} />
                    <CustomBtn title="Back" onPress={() => setStep(1)} />
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
