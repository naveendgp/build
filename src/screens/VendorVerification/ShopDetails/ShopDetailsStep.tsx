import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert, ScrollView, Modal } from 'react-native';
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [timeType, setTimeType] = useState<'start' | 'end'>('start');

  // Parse existing business hours if available
  React.useEffect(() => {
    if (shop.business_hours) {
      const parts = shop.business_hours.split(' - ');
      if (parts.length === 2) {
        setSelectedStartTime(parts[0].trim());
        setSelectedEndTime(parts[1].trim());
      }
    } else {
      setSelectedStartTime('');
      setSelectedEndTime('');
    }
  }, [shop.business_hours]);

  // Format time to 12-hour format with AM/PM
  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };


  // Handle time selection
  const handleTimeSelect = (time24: string) => {
    const time12 = formatTime(time24);
    if (timeType === 'start') {
      setSelectedStartTime(time12);
      setTimeType('end');
    } else {
      setSelectedEndTime(time12);
      const businessHours = `${selectedStartTime} - ${time12}`;
      setShop({ ...shop, business_hours: businessHours });
      setShowTimePicker(false);
      setTimeType('start');
    }
  };

  // Open time picker
  const handleOpenTimePicker = () => {
    if (!selectedStartTime) {
      setTimeType('start');
    } else if (!selectedEndTime) {
      setTimeType('end');
    } else {
      setTimeType('start');
    }
    setShowTimePicker(true);
  };

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
          required
          inputType="normal"
          value={shop.gst_number || ''}
          onChangeText={val => setShop({ ...shop, gst_number: val })}
          containerStyle={styles.inputContainer}
        />

        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ProfileLocation', {
              onSelect: (data: { address: string; latitude: number; longitude: number }) => {
                setShop({
                  ...shop,
                  address: data.address,
                  latitude: data.latitude.toString(),
                  longitude: data.longitude.toString(),
                });
              },
            });
          }}
          style={styles.addressContainer}
        >
          <CustomText style={styles.addressLabel}>
            Shop Address<CustomText style={styles.asterisk}>*</CustomText>
          </CustomText>
          <CustomTextInput
            placeholder="Type here"
            value={shop.address || ''}
            multiline
            numberOfLines={4}
            style={styles.addressInput}
            containerStyle={styles.addressInputContainer}
            label=""
            editable={false}
          />
        </TouchableOpacity>

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

        <TouchableOpacity
          onPress={handleOpenTimePicker}
          style={styles.inputContainer}
        >
          <ProfileInput
            label="Business Hours"
            required
            inputType="normal"
            value={shop.business_hours || ''}
            placeholder="10:00 AM - 08:00 PM"
            onChangeText={() => {}}
            containerStyle={styles.inputContainer}
            isEditable={false}
          />
        </TouchableOpacity>

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

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <CustomText style={styles.modalTitle}>
                Select Business Hours
              </CustomText>
              <TouchableOpacity
                onPress={() => {
                  setShowTimePicker(false);
                  setTimeType('start');
                }}
                style={styles.closeButton}
              >
                <CloseIcon width={24} height={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            {/* Selected Times Display */}
            <View style={styles.selectedTimesContainer}>
              <View style={styles.selectedTimeBox}>
                <CustomText style={styles.selectedTimeLabel}>Opening Time</CustomText>
                <CustomText style={[
                  styles.selectedTimeValue,
                  !selectedStartTime && styles.selectedTimePlaceholder
                ]}>
                  {selectedStartTime || 'Not selected'}
                </CustomText>
              </View>
              <View style={styles.timeSeparator}>
                <CustomText style={styles.timeSeparatorText}>-</CustomText>
              </View>
              <View style={styles.selectedTimeBox}>
                <CustomText style={styles.selectedTimeLabel}>Closing Time</CustomText>
                <CustomText style={[
                  styles.selectedTimeValue,
                  !selectedEndTime && styles.selectedTimePlaceholder
                ]}>
                  {selectedEndTime || 'Not selected'}
                </CustomText>
              </View>
            </View>

            {/* Time Selection Indicator */}
            <View style={styles.selectionIndicator}>
              <CustomText style={styles.selectionIndicatorText}>
                {timeType === 'start' 
                  ? 'Select Opening Time' 
                  : 'Select Closing Time'}
              </CustomText>
            </View>

            {/* Time Picker - Grouped by AM/PM */}
            <ScrollView
              style={styles.timePickerContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.timePickerContent}
            >
              {/* AM Section */}
              <View style={styles.timeSection}>
                <CustomText style={styles.timeSectionTitle}>AM</CustomText>
                <View style={styles.timeGrid}>
                  {Array.from({ length: 12 }, (_, hour) => (
                    <View key={`am-${hour}`} style={styles.hourRow}>
                      {Array.from({ length: 4 }, (_, quarter) => {
                        const minutes = quarter * 15;
                        const time24 = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        const time12 = formatTime(time24);
                        const isSelected =
                          (timeType === 'start' && selectedStartTime === time12) ||
                          (timeType === 'end' && selectedEndTime === time12);

                        return (
                          <TouchableOpacity
                            key={quarter}
                            style={[
                              styles.timeOption,
                              isSelected && styles.selectedTimeOption,
                            ]}
                            onPress={() => handleTimeSelect(time24)}
                          >
                            <CustomText
                              style={[
                                styles.timeOptionText,
                                isSelected && styles.selectedTimeOptionText,
                              ]}
                            >
                              {time12.split(' ')[0]}
                            </CustomText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>

              {/* PM Section */}
              <View style={styles.timeSection}>
                <CustomText style={styles.timeSectionTitle}>PM</CustomText>
                <View style={styles.timeGrid}>
                  {Array.from({ length: 12 }, (_, hour) => {
                    const hour24 = hour + 12;
                    return (
                      <View key={`pm-${hour24}`} style={styles.hourRow}>
                        {Array.from({ length: 4 }, (_, quarter) => {
                          const minutes = quarter * 15;
                          const time24 = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                          const time12 = formatTime(time24);
                          const isSelected =
                            (timeType === 'start' && selectedStartTime === time12) ||
                            (timeType === 'end' && selectedEndTime === time12);

                          return (
                            <TouchableOpacity
                              key={quarter}
                              style={[
                                styles.timeOption,
                                isSelected && styles.selectedTimeOption,
                              ]}
                              onPress={() => handleTimeSelect(time24)}
                            >
                              <CustomText
                                style={[
                                  styles.timeOptionText,
                                  isSelected && styles.selectedTimeOptionText,
                                ]}
                              >
                                {time12.split(' ')[0]}
                              </CustomText>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalButtonRow}>
              {selectedStartTime && timeType === 'end' && (
                <TouchableOpacity
                  style={styles.modalResetButton}
                  onPress={() => {
                    setTimeType('start');
                    setSelectedStartTime('');
                    setSelectedEndTime('');
                    setShop({ ...shop, business_hours: '' });
                  }}
                >
                  <CustomText style={styles.modalResetButtonText}>Reset</CustomText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowTimePicker(false);
                  setTimeType('start');
                }}
              >
                <CustomText style={styles.modalCancelButtonText}>Cancel</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ShopDetailsStep;
