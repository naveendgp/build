import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import CustomTextInput from '../../components/TextInput';
import { useNavigation } from '@react-navigation/native';

interface Props {
  shop: any;
  setShop: (s: any) => void;
}

const ShopDetailsStep: React.FC<Props> = ({ shop, setShop }) => {
  const navigation = useNavigation<any>();

  const handleLocationPress = () => {
    navigation.navigate('MapScreen', {
      onLocationSelect: (lat: number, lng: number) => {
        setShop({
          ...shop,
          latitude: lat.toString(),
          longitude: lng.toString(),
        });
      },
    });
  };

  return (
    <View>
      {/* Other shop fields */}
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
        label="City"
        value={shop.city}
        onChangeText={val => setShop({ ...shop, city: val })}
      />
      <CustomTextInput
        label="State"
        value={shop.state}
        onChangeText={val => setShop({ ...shop, state: val })}
      />
      <CustomTextInput
        label="Pincode"
        value={shop.pincode}
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={val => setShop({ ...shop, pincode: val })}
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

      <TouchableOpacity onPress={handleLocationPress}>
        <CustomTextInput
          label="Latitude"
          value={shop.latitude}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLocationPress}>
        <CustomTextInput
          label="Longitude"
          value={shop.longitude}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
    </View>
  );
};

export default ShopDetailsStep;
