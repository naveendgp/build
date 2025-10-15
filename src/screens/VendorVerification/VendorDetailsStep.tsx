import React from 'react';
import { View, TouchableOpacity, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomText from '../../components/Text';
import CustomTextInput from '../../components/TextInput';

interface VendorDetailsStepProps {
  vendorDetails: {
    owner_name: string;
    phone: string;
    email: string;
    address: string;
    profile_pic: string;
    aadhaar_no: string;
  };
  setVendorDetails: React.Dispatch<
    React.SetStateAction<{
      owner_name: string;
      phone: string;
      email: string;
      address: string;
      profile_pic: string;
    aadhaar_no: string;
    }>
  >;
  handleFocusScroll: (ref: any) => void;
  vendorAddressRef: React.RefObject<View | null>;
}

const VendorDetailsStep: React.FC<VendorDetailsStepProps> = ({
  vendorDetails,
  setVendorDetails,
  handleFocusScroll,
  vendorAddressRef,
}) => {
  const pickProfilePic = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick profile picture.');
      } else if (response.assets && response.assets[0]) {
        const source = response.assets[0].uri;
        setVendorDetails(d => ({ ...d, profile_pic: source || '' }));
        Alert.alert(
          'Profile Picture Selected',
          'Profile picture has been selected.',
        );
      }
    });
  };

  return (
    <View style={{ marginTop: 18 }}>
      <CustomTextInput
        label="Owner name"
        placeholder="Enter owner name"
        value={vendorDetails.owner_name}
        onChangeText={val => setVendorDetails(d => ({ ...d, owner_name: val }))}
      />

      <CustomTextInput
        label="Phone"
        placeholder="Enter phone"
        keyboardType="number-pad"
        value={vendorDetails.phone}
        maxLength={10}
        onChangeText={val => setVendorDetails(d => ({ ...d, phone: val }))}
      />

      <CustomTextInput
        label="Email (optional)"
        placeholder="Enter email"
        keyboardType="email-address"
        value={vendorDetails.email}
        onChangeText={val => setVendorDetails(d => ({ ...d, email: val }))}
      />

      <View style={{ marginTop: 14 }}>
        <TouchableOpacity
          onPress={pickProfilePic}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: '#ccc',
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f9f9f9',
          }}
        >
          {vendorDetails.profile_pic ? (
            <Image
              source={{ uri: vendorDetails.profile_pic }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : (
            <CustomText style={{ color: '#666', textAlign: 'center' }}>
              Tap to add profile picture
            </CustomText>
          )}
        </TouchableOpacity>
      </View>

      <CustomTextInput
        label="Aadhaar Number"
        placeholder="Enter Aadhaar number"
        keyboardType="number-pad"
        maxLength={12}
        value={vendorDetails.aadhaar_no}
        onChangeText={val => setVendorDetails(d => ({ ...d, aadhaar_no: val }))}
      />

      <View ref={vendorAddressRef as any}>
        <CustomTextInput
          label="Vendor Address"
          placeholder="Enter address"
          value={vendorDetails.address}
          onFocus={() => handleFocusScroll(vendorAddressRef)}
          onChangeText={val => setVendorDetails(d => ({ ...d, address: val }))}
        />
      </View>
    </View>
  );
};

export default VendorDetailsStep;
