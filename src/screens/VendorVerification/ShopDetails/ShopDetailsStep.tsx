import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import ProfileInput from '../../../components/ProfileInput';
import CustomText from '../../../components/Text';
import CustomTextInput from '../../../components/TextInput';
import CustomSwitch from '../../../components/CustomSwitch';
import { useNavigation } from '@react-navigation/native';
import styles from './shopDetailsStyles';
import LocationIcon from '../../../assets/auto-generated-svg-icons/LocationIcon';
import RightArrowIcon from '../../../assets/auto-generated-svg-icons/RightArrowIcon';
import UploadIcon from '../../../assets/auto-generated-svg-icons/UploadIcon';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import CloseIcon from '../../../assets/auto-generated-svg-icons/CloseIcon';
import { COLORS } from '../../../constants/colors';

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

  const pickShopPhoto = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick image');
        return;
      }
      if (response.assets?.[0]?.uri) {
        const fileUri = response.assets[0].uri;
        const fileName = response.assets[0].fileName || 'shop_front.jpg';
        setShop({
          ...shop,
          shop_front_photo: { uri: fileUri, name: fileName },
        });
      }
    });
  };

  const removeShopPhoto = () => {
    setShop({ ...shop, shop_front_photo: null });
  };

  const handleRepeatPress = () => {
    // Navigate to repeat days selection screen
    // For now, just show an alert
    Alert.alert('Repeat Days', 'Select repeat days functionality');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Shop Details Section */}
        

        <ProfileInput
          label="Shop Name"
          required
          inputType="normal"
          value={shop.shop_name || ''}
          onChangeText={val => setShop({ ...shop, shop_name: val })}
          containerStyle={styles.inputContainer}
        />

        <ProfileInput
          label="GST Number"
          inputType="normal"
          value={shop.gst_number || ''}
          onChangeText={val => setShop({ ...shop, gst_number: val })}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.addressContainer}>
          <CustomText style={styles.addressLabel}>
            Shop Address<CustomText style={styles.asterisk}>*</CustomText>
          </CustomText>
          <CustomTextInput
            placeholder="Type here"
            value={shop.address || ''}
            onChangeText={val => setShop({ ...shop, address: val })}
            multiline
            numberOfLines={4}
            style={styles.addressInput}
            containerStyle={styles.addressInputContainer}
            label=""
          />
        </View>

        <TouchableOpacity
          onPress={handleLocationPress}
          style={styles.locationButton}
        >
          <LocationIcon width={18} height={24} color={COLORS.THEME_GREEN} />
          <CustomText style={styles.locationButtonText}>
            Select Location In Map
          </CustomText>
        </TouchableOpacity>

        <ProfileInput
          label="Pin Code"
          required
          inputType="normal"
          value={shop.pincode || ''}
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={val => setShop({ ...shop, pincode: val })}
          containerStyle={styles.inputContainer}
        />

        <ProfileInput
          label="Landmark"
          required
          inputType="normal"
          value={shop.landmark || ''}
          onChangeText={val => setShop({ ...shop, landmark: val })}
          containerStyle={styles.inputContainer}
        />

        <ProfileInput
          label="Contact Number"
          inputType="phone"
          countryCode="+91"
          value={shop.contact_number || ''}
          onChangeText={val => setShop({ ...shop, contact_number: val })}
          containerStyle={styles.inputContainer}
        />

        {/* Shop Front Photo Upload Section */}
        <View style={styles.uploadSection}>
          <CustomText style={styles.uploadLabel}>Shop Front Photo</CustomText>
          {!shop.shop_front_photo ? (
            <TouchableOpacity
              onPress={pickShopPhoto}
              style={styles.uploadButton}
            >
              <UploadIcon width={24} height={24} color={COLORS.LOGIN_SUBTITLE} />
              <CustomText style={styles.uploadText}>Upload files</CustomText>
            </TouchableOpacity>
          ) : (
            <View style={styles.uploadedFileContainer}>
              <View style={styles.uploadedFileInfo}>
                <CheckIcon width={24} height={24} color={COLORS.SUCCESS} />
                <CustomText style={styles.uploadedFileName} numberOfLines={1}>
                  {shop.shop_front_photo.name || 'Filename.JPEG'}
                </CustomText>
              </View>
              <TouchableOpacity
                onPress={removeShopPhoto}
                style={styles.removeButton}
              >
                <CloseIcon width={24} height={24} color={COLORS.LOGIN_SUBTITLE} />
              </TouchableOpacity>
            </View>
          )}
        </View>
   </View>
        
        <View style={styles.card}>

       

        {/* Timings Details Section */}
        <CustomText style={styles.sectionTitle}>Timings Details</CustomText>

        <ProfileInput
          label="Business Hours"
          required
          inputType="normal"
          value={shop.business_hours || ''}
          placeholder="10:00 AM - 08:00 PM"
          onChangeText={val => setShop({ ...shop, business_hours: val })}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.switchContainer}>
          <CustomText style={styles.switchLabel}>
            Automatically Receive Orders During Business Hours
          </CustomText>
          <CustomSwitch
            value={shop.auto_receive_orders || false}
            onValueChange={val =>
              setShop({ ...shop, auto_receive_orders: val })
            }
          />
        </View>

        <TouchableOpacity
          onPress={handleRepeatPress}
          style={styles.repeatContainer}
        >
          <CustomText style={styles.repeatLabel}>Repeat</CustomText>
          <View style={styles.repeatValueContainer}>
            <CustomText style={styles.repeatValue}>
              {shop.repeat_days || 'Mon, Tue, Wed, Thu And Fri'}
            </CustomText>
            <RightArrowIcon
              width={20}
              height={20}
              color={COLORS.LOGIN_SUBTITLE}
            />
          </View>
        </TouchableOpacity>
    </View>
    </ScrollView>
  );
};

export default ShopDetailsStep;
