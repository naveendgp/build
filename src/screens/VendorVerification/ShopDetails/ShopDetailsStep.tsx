import React, { useState, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import ProfileInput from '../../../components/ProfileInput';
import CustomText from '../../../components/Text';
import CustomTextInput from '../../../components/TextInput';
import CustomSwitch from '../../../components/CustomSwitch';
import CustomBtn from '../../../components/CustomBtn';
import CustomBottomSheet from '../../../components/BottomSheet';
import { useNavigation } from '@react-navigation/native';
import styles from './shopDetailsStyles';
import LocationIcon from '../../../assets/auto-generated-svg-icons/LocateIcon';
import RightArrowIcon from '../../../assets/auto-generated-svg-icons/RightArrowIcon';
import UploadIcon from '../../../assets/auto-generated-svg-icons/UploadIcon';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import CloseIcon from '../../../assets/auto-generated-svg-icons/CloseIcon';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import { ShopErrors } from '../useVendorValidation';

interface Props {
  shop: any;
  setShop: (s: any) => void;
  errors?: ShopErrors;
  clearError?: (field: keyof ShopErrors) => void;
}

const ShopDetailsStep: React.FC<Props> = ({ shop, setShop, errors = {}, clearError }) => {
  const navigation = useNavigation<any>();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [timeType, setTimeType] = useState<'start' | 'end'>('start');
  // Temporary state for time picker (only saved when both times are selected)
  const [tempSelectedStartTime, setTempSelectedStartTime] = useState<string>('');
  const [tempSelectedEndTime, setTempSelectedEndTime] = useState<string>('');
  const [showRepeatSheet, setShowRepeatSheet] = useState(false);
  const DEFAULT_REPEAT_DISPLAY = 'Mon, Tue, Wed, Thu, Fri';

  // Days of the week
  const daysOfWeek = [
    { key: 'sunday', label: 'Every Sunday', short: 'Sun' },
    { key: 'monday', label: 'Every Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Every Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Every Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Every Thursday', short: 'Thu' },
    { key: 'friday', label: 'Every Friday', short: 'Fri' },
    { key: 'saturday', label: 'Every Saturday', short: 'Sat' },
  ];

  // Parse existing repeat_days to selected days
  const parseRepeatDays = (repeatDays: string): string[] => {
    if (!repeatDays) return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const selected: string[] = [];
    const lowerRepeat = repeatDays.toLowerCase();
    daysOfWeek.forEach(day => {
      if (lowerRepeat.includes(day.short.toLowerCase()) || lowerRepeat.includes(day.key)) {
        selected.push(day.key);
      }
    });
    return selected.length > 0 ? selected : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  };

  const [selectedDays, setSelectedDays] = useState<string[]>(() =>
    parseRepeatDays(shop.repeat_days || '')
  );

  // Temporary state for bottom sheet (only saved when "Save" is clicked)
  const [tempSelectedDays, setTempSelectedDays] = useState<string[]>([]);

  // Update selected days when shop.repeat_days changes
  useEffect(() => {
    setSelectedDays(parseRepeatDays(shop.repeat_days || ''));
  }, [shop.repeat_days]);

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


  // Handle time selection (works with temporary state)
  const handleTimeSelect = (time24: string) => {
    const time12 = formatTime(time24);
    if (timeType === 'start') {
      setTempSelectedStartTime(time12);
      setTimeType('end');
    } else {
      setTempSelectedEndTime(time12);
      // Both times selected - save immediately
      const businessHours = `${tempSelectedStartTime} - ${time12}`;
      setSelectedStartTime(tempSelectedStartTime);
      setSelectedEndTime(time12);
      setShop({ ...shop, business_hours: businessHours });
      clearError?.('business_hours');
      setShowTimePicker(false);
      setTimeType('start');
    }
  };

  // Open time picker - initialize temporary state with current saved data
  const handleOpenTimePicker = () => {
    // Initialize temporary state with current saved values
    setTempSelectedStartTime(selectedStartTime);
    setTempSelectedEndTime(selectedEndTime);

    // Determine which time to select next
    if (!selectedStartTime) {
      setTimeType('start');
    } else if (!selectedEndTime) {
      setTimeType('end');
    } else {
      setTimeType('start');
    }
    setShowTimePicker(true);
  };

  // Close time picker without saving
  const handleCloseTimePicker = () => {
    setShowTimePicker(false);
    setTimeType('start');
    // Reset temporary state (will be reinitialized when reopened)
  };

  const handleLocationPress = () => {
    navigation.navigate('ProfileLocation', {
      onSelect: (data: { address: string; address_line2?: string; latitude: number; longitude: number }) => {
        setShop({
          ...shop,
          address: data.address, // Full address for address_line1
          address_line2: data.address_line2 || '', // City, state overview for address_line2
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
        });
      },
      // Pass existing location data if available
      existingData: shop.address && shop.latitude && shop.longitude ? {
        address: shop.address, // Full address (for address_line1)
        address_line2: shop.address_line2, // City, state (for address_line2)
        latitude: parseFloat(shop.latitude),
        longitude: parseFloat(shop.longitude),
      } : undefined,
    });
    // navigation.navigate('MapScreen', {
    //   onLocationSelect: (lat: number, lng: number) => {
    //     setShop({
    //       ...shop,
    //       latitude: lat.toString(),
    //       longitude: lng.toString(),
    //     });
    //   },
    // });
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
        clearError?.('shop_front_photo');
      }
    });
  };

  const removeShopPhoto = () => {
    setShop({ ...shop, shop_front_photo: null });
  };

  const handleRepeatPress = () => {
    // Initialize temp state with current saved data when opening bottom sheet
    setTempSelectedDays(parseRepeatDays(shop.repeat_days || ''));
    setShowRepeatSheet(true);
  };

  const toggleDay = (dayKey: string) => {
    // Update temporary state only (not saved until "Save" is clicked)
    setTempSelectedDays(prev => {
      if (prev.includes(dayKey)) {
        return prev.filter(d => d !== dayKey);
      } else {
        return [...prev, dayKey];
      }
    });
  };

  const handleSaveRepeatDays = () => {
    // Save the temporary state to actual state and shop data
    const selectedDayLabels = tempSelectedDays
      .map(dayKey => {
        const day = daysOfWeek.find(d => d.key === dayKey);
        return day?.short || '';
      })
      .filter(Boolean)
      .sort((a, b) => {
        const indexA = daysOfWeek.findIndex(day => day.short === a);
        const indexB = daysOfWeek.findIndex(day => day.short === b);
        return indexA - indexB;
      });

    const formattedDays =
      selectedDayLabels.length > 0 ? selectedDayLabels.join(', ') : DEFAULT_REPEAT_DISPLAY;

    setSelectedDays(tempSelectedDays);
    setShop({ ...shop, repeat_days: formattedDays });
    setShowRepeatSheet(false);
  };

  const handleCloseRepeatSheet = () => {
    // Discard temporary changes and close
    setShowRepeatSheet(false);
    // Reset temp state will happen when sheet reopens
  };

  const formatRepeatDaysDisplay = (repeatDays: string): string => {
    if (!repeatDays) return DEFAULT_REPEAT_DISPLAY;
    return repeatDays;
  };

  const formatTimeForDisplay = (timeString: string): string => {
    if (!timeString) return '';
    const trimmed = timeString.trim();
    const periodMatch = trimmed.match(/(AM|PM)$/i);
    let timePart = trimmed;
    let periodInput = '';
    if (periodMatch) {
      periodInput = periodMatch[1].toUpperCase();
      timePart = trimmed.replace(periodMatch[0], '').trim();
    }
    let [hoursStr, minutesStr = '00'] = timePart.split(':');
    let hours = parseInt(hoursStr, 10);
    let minutes = parseInt(minutesStr, 10) || 0;
    if (isNaN(hours)) return trimmed;
    if (periodInput) {
      if (periodInput === 'PM' && hours < 12) hours += 12;
      if (periodInput === 'AM' && hours === 12) hours = 0;
    }
    const isPM = hours >= 12;
    const displayHour = hours % 12 || 12;
    const displayPeriod = isPM ? 'PM' : 'AM';
    return minutes === 0
      ? `${displayHour} ${displayPeriod}`
      : `${displayHour}:${minutes.toString().padStart(2, '0')} ${displayPeriod}`;
  };

  const getBusinessHoursDisplay = (businessHours?: string): string => {
    if (!businessHours) return '';
    const trimmed = businessHours.trim();
    if (!trimmed) return '';
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const firstActiveDay =
          daysOfWeek.find(day => parsed[day.key])?.key || Object.keys(parsed)[0];
        if (firstActiveDay && parsed[firstActiveDay]) {
          const { open, close } = parsed[firstActiveDay];
          if (open && close) {
            return `${formatTimeForDisplay(open)} - ${formatTimeForDisplay(close)}`;
          }
        }
      }
    } catch (error) {
      // Not JSON, fall back to string parsing
    }
    const [startRaw, endRaw] = trimmed.split('-').map(part => part.trim());
    if (startRaw && endRaw) {
      return `${formatTimeForDisplay(startRaw)} - ${formatTimeForDisplay(endRaw)}`;
    }
    return trimmed;
  };

  const businessHoursDisplay = useMemo(
    () => getBusinessHoursDisplay(shop.business_hours),
    [shop.business_hours]
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Shop Details Section */}


        <ProfileInput
          label="Shop Name"
          required
          inputType="normal"
          value={shop.shop_name || ''}
          onChangeText={val => {
            setShop({ ...shop, shop_name: val });
            clearError?.('shop_name');
          }}
          containerStyle={styles.inputContainer}
          error={errors.shop_name}
        />

        <ProfileInput
          label="GST Number"
          required
          inputType="normal"
          value={shop.gst_number || ''}
          onChangeText={val => {
            // Convert to uppercase and limit to 15 characters
            const upperVal = val.toUpperCase().slice(0, 15);
            setShop({ ...shop, gst_number: upperVal });
            clearError?.('gst_number');
          }}
          containerStyle={styles.inputContainer}
          autoCapitalize="characters"
          maxLength={15}
          error={errors.gst_number}
        />

        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ProfileLocation', {
              onSelect: (data: { address: string; address_line2?: string; latitude: number; longitude: number }) => {
                setShop({
                  ...shop,
                  address: data.address, // Overview address (city, state) for address_line1
                  address_line2: data.address_line2 || '', // Full address for address_line2
                  latitude: data.latitude.toString(),
                  longitude: data.longitude.toString(),
                });
                clearError?.('address');
              },
              // Pass existing location data if available
              existingData: shop.address && shop.latitude && shop.longitude ? {
                address: shop.address,
                latitude: parseFloat(shop.latitude),
                longitude: parseFloat(shop.longitude),
              } : undefined,
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
        {errors.address && (
          <CustomText style={styles.errorText}>{errors.address}</CustomText>
        )}

        <TouchableOpacity
          onPress={handleLocationPress}
          style={styles.locationButton}
        >
          <LocationIcon />
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
          onChangeText={val => {
            setShop({ ...shop, pincode: val });
            clearError?.('pincode');
          }}
          containerStyle={styles.inputContainer}
          error={errors.pincode}
        />

        <ProfileInput
          label="Landmark"
          required
          inputType="normal"
          value={shop.landmark || ''}
          onChangeText={val => {
            setShop({ ...shop, landmark: val });
            clearError?.('landmark');
          }}
          containerStyle={styles.inputContainer}
          error={errors.landmark}
        />

        <ProfileInput
          label="Contact Number"
          required
          inputType="phone"
          countryCode="+91"
          value={shop.contact_number || ''}
          onChangeText={val => {
            setShop({ ...shop, contact_number: val });
            clearError?.('contact_number');
          }}
          containerStyle={styles.inputContainer}
          error={errors.contact_number}
        />

        {/* Shop Front Photo Upload Section */}
        <View style={styles.uploadSection}>
          <CustomText style={styles.uploadLabel}>
            Shop Front Photo<CustomText style={styles.asterisk}>*</CustomText>
          </CustomText>
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
          {errors.shop_front_photo && (
            <CustomText style={styles.errorText}>{errors.shop_front_photo}</CustomText>
          )}
        </View>
      </View>

      <View style={styles.card}>



        {/* Timings Details Section */}
        <CustomText style={styles.sectionTitle}>Timings Details</CustomText>

        <TouchableOpacity
          onPress={handleOpenTimePicker}

        >
          <ProfileInput
            label="Business Hours"
            required
            inputType="normal"
            value={businessHoursDisplay || ''}
            placeholder="9 AM - 6 PM"
            onChangeText={() => { }}
            containerStyle={{ marginBottom: 16, }}
            isEditable={false}
            error={errors.business_hours}
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
              {formatRepeatDaysDisplay(shop.repeat_days)}
            </CustomText>
            <RightArrowIcon
              width={20}
              height={20}
              color={COLORS.LOGIN_SUBTITLE}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Repeat Days Selection Bottom Sheet */}
      <CustomBottomSheet
        isVisible={showRepeatSheet}
        onClose={handleCloseRepeatSheet}
        bgColor={COLORS.WHITE}
        dismissible={true}
      >
        <View style={styles.repeatSheetContent}>
          <CustomText style={styles.repeatSheetTitle}>Repeat</CustomText>
          {daysOfWeek.map((day, index) => {
            // Use tempSelectedDays instead of selectedDays for UI
            const isSelected = tempSelectedDays.includes(day.key);
            return (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.repeatDayItem,
                ]}
                onPress={() => toggleDay(day.key)}
                activeOpacity={0.7}
              >
                <CustomText style={styles.repeatDayLabel}>{day.label}</CustomText>
                <View
                  style={[
                    styles.repeatCheckbox,
                    isSelected && styles.repeatCheckboxSelected,
                  ]}
                >
                  {isSelected && (
                    <CheckIcon width={16} height={16} color={COLORS.WHITE} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.repeatSheetButtonContainer}>
            <CustomBtn
              title="Save"
              onPress={handleSaveRepeatDays}
              disabled={tempSelectedDays.length === 0}
              style={[
                styles.repeatSaveButton,
                tempSelectedDays.length === 0 && styles.repeatSaveButtonDisabled,
              ] as any}
              textStyle={styles.repeatSaveButtonText}
            />
          </View>
        </View>
      </CustomBottomSheet>

      {/* Time Picker Bottom Sheet */}
      <CustomBottomSheet
        isVisible={showTimePicker}
        onClose={handleCloseTimePicker}
        bgColor={COLORS.WHITE}
        dismissible={true}
      >
        <View style={styles.timePickerSheetContent}>
          <CustomText style={styles.timePickerSheetTitle}>
            Select Business Hours
          </CustomText>

          {/* Selected Times Display */}
          <View style={styles.selectedTimesContainer}>
            <View style={styles.selectedTimeBox}>
              <CustomText style={styles.selectedTimeLabel}>Opening Time</CustomText>
              <CustomText style={[
                styles.selectedTimeValue,
                !tempSelectedStartTime && styles.selectedTimePlaceholder
              ]}>
                {tempSelectedStartTime || 'Not selected'}
              </CustomText>
            </View>
            <View style={styles.timeSeparator}>
              <CustomText style={styles.timeSeparatorText}>-</CustomText>
            </View>
            <View style={styles.selectedTimeBox}>
              <CustomText style={styles.selectedTimeLabel}>Closing Time</CustomText>
              <CustomText style={[
                styles.selectedTimeValue,
                !tempSelectedEndTime && styles.selectedTimePlaceholder
              ]}>
                {tempSelectedEndTime || 'Not selected'}
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
          <View style={styles.timePickerContainer}>
            {/* AM Section */}
            <View style={styles.timeSection}>
              <CustomText style={styles.timeSectionTitle}>AM</CustomText>
              <View style={styles.timeGrid}>
                {Array.from({ length: 12 }, (_, hour) => {
                  const time24 = `${hour.toString().padStart(2, '0')}:00`;
                  const time12 = formatTime(time24);
                  const isSelected =
                    (timeType === 'start' && tempSelectedStartTime === time12) ||
                    (timeType === 'end' && tempSelectedEndTime === time12);

                  // Group hours into rows of 2
                  if (hour % 2 === 0) {
                    const nextHour = hour + 1;
                    const nextTime24 = nextHour < 12 ? `${nextHour.toString().padStart(2, '0')}:00` : null;
                    const nextTime12 = nextTime24 ? formatTime(nextTime24) : null;
                    const isNextSelected = nextTime12 && (
                      (timeType === 'start' && tempSelectedStartTime === nextTime12) ||
                      (timeType === 'end' && tempSelectedEndTime === nextTime12)
                    );

                    return (
                      <View key={`am-row-${hour}`} style={styles.hourRow}>
                        <TouchableOpacity
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
                        {nextTime24 ? (
                          <TouchableOpacity
                            style={[
                              styles.timeOption,
                              isNextSelected && styles.selectedTimeOption,
                            ]}
                            onPress={() => handleTimeSelect(nextTime24)}
                          >
                            <CustomText
                              style={[
                                styles.timeOptionText,
                                isNextSelected && styles.selectedTimeOptionText,
                              ]}
                            >
                              {nextTime12?.split(' ')[0]}
                            </CustomText>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.timeOption} />
                        )}
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            </View>

            {/* PM Section */}
            <View style={styles.timeSection}>
              <CustomText style={styles.timeSectionTitle}>PM</CustomText>
              <View style={styles.timeGrid}>
                {Array.from({ length: 12 }, (_, hour) => {
                  const hour24 = hour + 12;
                  const time24 = `${hour24.toString().padStart(2, '0')}:00`;
                  const time12 = formatTime(time24);
                  const isSelected =
                    (timeType === 'start' && tempSelectedStartTime === time12) ||
                    (timeType === 'end' && tempSelectedEndTime === time12);

                  // Group hours into rows of 2
                  if (hour % 2 === 0) {
                    const nextHour = hour + 1;
                    const nextHour24 = nextHour < 12 ? nextHour + 12 : null;
                    const nextTime24 = nextHour24 ? `${nextHour24.toString().padStart(2, '0')}:00` : null;
                    const nextTime12 = nextTime24 ? formatTime(nextTime24) : null;
                    const isNextSelected = nextTime12 && (
                      (timeType === 'start' && tempSelectedStartTime === nextTime12) ||
                      (timeType === 'end' && tempSelectedEndTime === nextTime12)
                    );

                    return (
                      <View key={`pm-row-${hour24}`} style={styles.hourRow}>
                        <TouchableOpacity
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
                        {nextTime24 ? (
                          <TouchableOpacity
                            style={[
                              styles.timeOption,
                              isNextSelected && styles.selectedTimeOption,
                            ]}
                            onPress={() => handleTimeSelect(nextTime24)}
                          >
                            <CustomText
                              style={[
                                styles.timeOptionText,
                                isNextSelected && styles.selectedTimeOptionText,
                              ]}
                            >
                              {nextTime12?.split(' ')[0]}
                            </CustomText>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.timeOption} />
                        )}
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.timePickerButtonRow}>
            {tempSelectedStartTime && timeType === 'end' && (
              <CustomBtn
                title="Reset"
                onPress={() => {
                  setTimeType('start');
                  setTempSelectedStartTime('');
                  setTempSelectedEndTime('');
                }}
                style={styles.timePickerResetButton}
                textStyle={styles.timePickerResetButtonText}
              />
            )}
            <CustomBtn
              title="Cancel"
              onPress={handleCloseTimePicker}
              style={styles.timePickerCancelButton}
              textStyle={styles.timePickerCancelButtonText}
            />
          </View>
        </View>
      </CustomBottomSheet>
    </ScrollView>
  );
};

export default ShopDetailsStep;
