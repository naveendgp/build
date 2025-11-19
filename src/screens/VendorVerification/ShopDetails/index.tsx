import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useVendorVerificationStore } from '../../../apiService/store/useVendorVerificationStore';
import ShopDetailsStep from './ShopDetailsStep';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';

type ShopDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'ShopDetails'>;

const ShopDetailsScreen: React.FC = () => {
    const navigation = useNavigation<ShopDetailsNavProp>();
    const { shop: storeShop, setShopData } = useVendorVerificationStore();

    const [shop, setShop] = useState({
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
    });

    // Update shop when store changes
    useEffect(() => {
        if (storeShop.shop_name) {
            setShop(prev => ({
                ...prev,
                ...storeShop,
            }));
        }
    }, [storeShop]);

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

