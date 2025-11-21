import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
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

    const handleSave = () => {
        // Save to store
        setShopData(shop);
        // Navigate back
        navigation.goBack();
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
                                title="Save"
                                onPress={handleSave}
                                style={styles.nextButton}
                                textStyle={styles.nextButtonText}
                            />
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ShopDetailsScreen;

