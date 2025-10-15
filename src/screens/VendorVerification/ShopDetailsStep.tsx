import React from 'react';
import { View } from 'react-native';
import CustomTextInput from '../../components/TextInput';

interface ShopDetailsStepProps {
  shopDetails: {
    gst_number: string;
    shop_license_number: string;
    address: string;
    shop_time: string;
    landmark: string;
  };
  setShopDetails: React.Dispatch<
    React.SetStateAction<{
      gst_number: string;
      shop_license_number: string;
      address: string;
      shop_time: string;
      landmark: string;
    }>
  >;
  handleFocusScroll: (ref: any) => void;
  pincodeRef: React.RefObject<View | null>;
}

const ShopDetailsStep: React.FC<ShopDetailsStepProps> = ({
  shopDetails,
  setShopDetails,
  handleFocusScroll,
  pincodeRef,
}) => {
  return (
    <View style={{ marginTop: 18 }}>
      <CustomTextInput
        label="GST Number"
        placeholder="Enter GST number"
        value={shopDetails.gst_number}
        onChangeText={val => setShopDetails(s => ({ ...s, gst_number: val }))}
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
        onChangeText={val => setShopDetails(s => ({ ...s, address: val }))}
      />

      <CustomTextInput
        label="Shop Time"
        placeholder="Enter Shop Time"
        value={shopDetails.shop_time}
        onChangeText={val => setShopDetails(s => ({ ...s, shop_time: val }))}
      />

      <CustomTextInput
        label="Landmark"
        placeholder="Enter landmark"
        value={shopDetails.landmark}
        onChangeText={val => setShopDetails(s => ({ ...s, landmark: val }))}
      />
    </View>
  );
};

export default ShopDetailsStep;
