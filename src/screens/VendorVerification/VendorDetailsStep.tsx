import React from 'react';
import { View, TouchableOpacity, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomText from '../../components/Text';
import CustomTextInput from '../../components/TextInput';

interface VendorDetailsStepProps {
  vendorDetails: {
    owner_name: string;
    email: string;
    address: string;
    aadhaar_no: string;
  };
  setVendorDetails: React.Dispatch<
    React.SetStateAction<{
      owner_name: string;
      email: string;
      address: string;
      aadhaar_no: string;
    }>
  >;
  handleFocusScroll: (ref: any) => void;
  vendorAddressRef: React.RefObject<View | null>;
}
interface Props {
  vendor: any;
  setVendor: (v: any) => void;
  handleFocusScroll: (ref: any) => void;
  vendorAddressRef: React.RefObject<View | null>;
}

const VendorDetailsStep: React.FC<Props> = ({
  vendor,
  setVendor,
  handleFocusScroll,
  vendorAddressRef,
}) => {
  const pickProfilePic = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, res => {
      if (res.assets?.[0]?.uri)
        setVendor({ ...vendor, profile_pic: res.assets[0].uri });
    });
  };

  return (
    <View>
      <CustomTextInput
        label="Owner Name"
        value={vendor.owner_name}
        onChangeText={val => setVendor({ ...vendor, owner_name: val })}
      />
      {/* <CustomTextInput
        label="Phone"
        value={vendor.phone}
        keyboardType="number-pad"
        maxLength={10}
        onChangeText={val => setVendor({ ...vendor, phone: val })}
      /> */}
      <CustomTextInput
        label="Email (optional)"
        value={vendor.email}
        onChangeText={val => setVendor({ ...vendor, email: val })}
      />

      {/* <View style={{ marginTop: 14 }}>
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
          {vendor.profile_pic ? (
            <Image
              source={{ uri: vendor.profile_pic }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : null}
        </TouchableOpacity>
      </View> */}

      <CustomTextInput
        label="PAN Number"
        value={vendor.pan_number}
        onChangeText={val => setVendor({ ...vendor, pan_number: val })}
      />
      <CustomTextInput
        label="Aadhaar Number"
        value={vendor.aadhaar_no}
        keyboardType="number-pad"
        maxLength={12}
        onChangeText={val => setVendor({ ...vendor, aadhaar_no: val })}
      />
      <View ref={vendorAddressRef as any}>
        <CustomTextInput
          label="Vendor Address"
          value={vendor.address}
          onFocus={() => handleFocusScroll(vendorAddressRef)}
          onChangeText={val => setVendor({ ...vendor, address: val })}
        />
      </View>
    </View>
  );
};

export default VendorDetailsStep;
