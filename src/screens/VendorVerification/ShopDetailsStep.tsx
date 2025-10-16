import React from 'react';
import { View } from 'react-native';
import CustomTextInput from '../../components/TextInput';

interface Props {
  shop: any;
  setShop: (s: any) => void;
  handleFocusScroll: (ref: any) => void;
  pincodeRef: React.RefObject<View | null>;
}

const ShopDetailsStep: React.FC<Props> = ({ shop, setShop }) => {
  return (
    <View>
      <CustomTextInput
        label="GST Number"
        value={shop.gst_number}
        onChangeText={val => setShop({ ...shop, gst_number: val })}
      />
      <CustomTextInput
        label="Shop License Number"
        value={shop.shop_license_number}
        onChangeText={val => setShop({ ...shop, shop_license_number: val })}
      />
      <CustomTextInput
        label="Address"
        value={shop.address}
        onChangeText={val => setShop({ ...shop, address: val })}
      />
      <CustomTextInput
        label="Shop Time"
        value={shop.shop_time}
        onChangeText={val => setShop({ ...shop, shop_time: val })}
      />
      <CustomTextInput
        label="Landmark"
        value={shop.landmark}
        onChangeText={val => setShop({ ...shop, landmark: val })}
      />
      <CustomTextInput
        label="Latitude"
        value={shop.latitude}
        onChangeText={val => setShop({ ...shop, latitude: val })}
      />
      <CustomTextInput
        label="Longitude"
        value={shop.longitude}
        onChangeText={val => setShop({ ...shop, longitude: val })}
      />
    </View>
  );
};

export default ShopDetailsStep;
