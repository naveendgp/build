import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { updateShop } from '../../../apiService/api/profileApi';
import { UpdateShopInput, OperatingHoursInput } from '../../../apiService/types/profileTypes';
import { showErrorToast, showSuccessToast } from '../../../utils/Toast';
import { getMimeTypeFromExtension } from '../../../utils/fileUtils';
import ShopDetailsStep from './ShopDetailsStep';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';

type ShopDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'ShopDetails'>;

const ShopDetailsScreen: React.FC = () => {
    const navigation = useNavigation<ShopDetailsNavProp>();
    const { shop: storeShop, setShopData } = useVendorVerificationStore();
    const { profile } = useProfileStore();

    // Helper to convert operating hours to string format
    const formatOperatingHours = (operatingHours?: any): string => {
        if (!operatingHours) return '';
        return JSON.stringify(operatingHours);
    };

    // Helper to extract repeat days from operating hours
    const extractRepeatDays = (operatingHours?: any): string => {
        if (!operatingHours) return 'Mon, Tue, Wed, Thu, Fri';
        const orderedKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const shortNamesMap: Record<string, string> = {
            sunday: 'Sun',
            monday: 'Mon',
            tuesday: 'Tue',
            wednesday: 'Wed',
            thursday: 'Thu',
            friday: 'Fri',
            saturday: 'Sat',
        };
        const activeDays = orderedKeys.filter(day => operatingHours[day]);
        if (!activeDays.length) return 'Mon, Tue, Wed, Thu, Fri';
        return activeDays.map(day => shortNamesMap[day] || day).join(', ');
    };

    // Initialize from profile store if available, otherwise from vendor verification store
    const getInitialShopData = () => {
        if (profile) {
            return {
                shop_name: profile.shop_name || '',
                gst_number: profile.gst_number || '',
                shop_license_number: profile.shop_license_number || '',
                address: profile.address?.address_line1 || '',
                address_line2: profile.address?.address_line2 || '',
                city: profile.address?.city || '',
                state: profile.address?.state || '',
                pincode: profile.address?.pincode || '',
                shop_time: storeShop.shop_time || '',
                landmark: profile.address?.landmark || '',
                latitude: profile.address?.latitude?.toString() || '',
                longitude: profile.address?.longitude?.toString() || '',
                contact_number: profile.phone || '',
                shop_front_photo: profile.shop_image_url
                    ? { uri: profile.shop_image_url, name: 'Shop Image' }
                    : storeShop.shop_front_photo || null,
                business_hours: formatOperatingHours(profile.operating_hours) || '',
                auto_receive_orders: storeShop.auto_receive_orders || false,
                repeat_days: extractRepeatDays(profile.operating_hours) || '',
            };
        }
        // Fallback to vendor verification store
        return {
            shop_name: storeShop.shop_name || '',
            gst_number: storeShop.gst_number || '',
            shop_license_number: storeShop.shop_license_number || '',
            address: storeShop.address || '',
            address_line2: storeShop.address_line2 || '',
            city: storeShop.city || '',
            state: storeShop.state || '',
            pincode: storeShop.pincode || '',
            shop_time: storeShop.shop_time || '',
            landmark: storeShop.landmark || '',
            latitude: storeShop.latitude || '',
            longitude: storeShop.longitude || '',
            contact_number: storeShop.contact_number || '',
            shop_front_photo: storeShop.shop_front_photo || null,
            business_hours: storeShop.business_hours || '',
            auto_receive_orders: storeShop.auto_receive_orders || false,
            repeat_days: storeShop.repeat_days || '',
        };
    };

    const [shop, setShop] = useState(getInitialShopData());

    // Update shop when profile changes
    useEffect(() => {
        if (profile) {
            setShop(prev => ({
                ...prev,
                shop_name: profile.shop_name || prev.shop_name,
                gst_number: profile.gst_number || prev.gst_number,
                shop_license_number: profile.shop_license_number || prev.shop_license_number,
                address: profile.address?.address_line1 || prev.address,
                address_line2: profile.address?.address_line2 || prev.address_line2,
                city: profile.address?.city || prev.city,
                state: profile.address?.state || prev.state,
                pincode: profile.address?.pincode || prev.pincode,
                landmark: profile.address?.landmark || prev.landmark,
                latitude: profile.address?.latitude?.toString() || prev.latitude,
                longitude: profile.address?.longitude?.toString() || prev.longitude,
                contact_number: profile.phone || prev.contact_number,
                shop_front_photo: profile.shop_image_url
                    ? { uri: profile.shop_image_url, name: 'Shop Image' }
                    : prev.shop_front_photo,
                business_hours: formatOperatingHours(profile.operating_hours) || prev.business_hours,
                repeat_days: extractRepeatDays(profile.operating_hours) || prev.repeat_days,
            }));
        }
    }, [profile]);

    // Update shop when store changes (fallback)
    useEffect(() => {
        if (!profile && storeShop.shop_name) {
            setShop(prev => ({
                ...prev,
                ...storeShop,
            }));
        }
    }, [storeShop, profile]);

    // Helper function to parse operating hours from business_hours string
    const parseOperatingHours = (businessHours: string, repeatDays?: string): OperatingHoursInput => {
        if (!businessHours) return {};

        // Try to parse as JSON first (if it's already in JSON format)
        try {
            const parsed = JSON.parse(businessHours);
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed as OperatingHoursInput;
            }
        } catch (e) {
            // Not JSON, continue to parse as string format
        }

        // Parse string format like "9 AM - 6 PM"
        const parts = businessHours.split(' - ');
        if (parts.length === 2) {
            const openTime = parts[0].trim();
            const closeTime = parts[1].trim();

            // If repeat_days is provided, use it to determine which days to apply
            if (repeatDays) {
                const operatingHours: OperatingHoursInput = {};
                const dayMap: Record<string, string> = {
                    'Mon': 'monday',
                    'Tue': 'tuesday',
                    'Wed': 'wednesday',
                    'Thu': 'thursday',
                    'Fri': 'friday',
                    'Sat': 'saturday',
                    'Sun': 'sunday',
                };

                // Parse repeat_days (e.g., "Mon, Tue, Wed, Thu, Fri")
                const days = repeatDays.split(',').map(d => d.trim());
                days.forEach(day => {
                    const dayKey = dayMap[day];
                    if (dayKey) {
                        operatingHours[dayKey] = {
                            open: openTime,
                            close: closeTime,
                        };
                    }
                });

                return operatingHours;
            }

            // If no repeat_days, apply to all days
            return {
                monday: { open: openTime, close: closeTime },
                tuesday: { open: openTime, close: closeTime },
                wednesday: { open: openTime, close: closeTime },
                thursday: { open: openTime, close: closeTime },
                friday: { open: openTime, close: closeTime },
                saturday: { open: openTime, close: closeTime },
                sunday: { open: openTime, close: closeTime },
            };
        }

        return {};
    };

    // Helper function to normalize file object
    const normalizeFile = (file: any, defaultName: string) => {
        if (!file) return undefined;
        // Handle string URI (from API)
        if (typeof file === 'string') {
            return {
                uri: file,
                name: defaultName,
                type: getMimeTypeFromExtension(defaultName),
            };
        }
        // Handle object with uri and name
        if (file.uri) {
            const fileName = file.name || defaultName;
            const mimeType = getMimeTypeFromExtension(fileName);
            return {
                uri: file.uri,
                name: fileName,
                type: mimeType,
            };
        }
        return undefined;
    };

    const updateShopMutation = useMutation({
        mutationFn: async () => {
            const payload: UpdateShopInput = {
                shop_name: shop.shop_name,
                gst_number: shop.gst_number,
                address_line1: shop.address,
                address_line2: shop.address_line2,
                pincode: shop.pincode,
                landmark: shop.landmark,
                latitude: parseFloat(shop.latitude) || 0,
                longitude: parseFloat(shop.longitude) || 0,
                contact_number: shop.contact_number,
                business_hours: parseOperatingHours(shop.business_hours || '', shop.repeat_days),
                auto_receive_orders: shop.auto_receive_orders,
                repeat_days: shop.repeat_days,
            };

            const images = {
                shop_image: normalizeFile(shop.shop_front_photo, 'shop_image.jpg'),
            };

            return updateShop(payload, images);
        },
        onSuccess: (data) => {
            if (data.status) {
                showSuccessToast(data.message || 'Shop details updated successfully');
                // Save to store
                setShopData(shop);
                // Refresh profile data
                useProfileStore.getState().refreshProfile();
                // Navigate back
                navigation.goBack();
            } else {
                showErrorToast(data.message || 'Failed to update shop details');
            }
        },
        onError: (error: AxiosError<{ message: string }>) => {
            const msg = error.response?.data?.message || error.message;
            showErrorToast(msg || 'Failed to update shop details');
        },
    });

    const handleSave = () => {
        updateShopMutation.mutate();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.WHITE }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Toolbar title="Shop Details" />
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ padding: 20 }}
                    >
                        <ShopDetailsStep
                            shop={shop}
                            setShop={setShop}
                        />
                        <View style={styles.buttonRow}>
                            <CustomBtn
                                title={updateShopMutation.isPending ? "Saving..." : "Save"}
                                onPress={handleSave}
                                disabled={updateShopMutation.isPending}
                                style={styles.nextButton}
                                textStyle={styles.nextButtonText}
                            />
                        </View>
                        {updateShopMutation.isPending && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
                            </View>
                        )}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ShopDetailsScreen;

