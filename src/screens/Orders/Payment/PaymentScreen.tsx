import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import CustomInAppWebView from '../../../components/CustomInAppWebView';
import SvgBackArrowIcon from '../../../assets/auto-generated-svg-icons/BackArrowIcon';
import Toolbar from '../../../components/Toolbar';

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'PaymentScreen'>;
type PaymentScreenNavProp = NativeStackNavigationProp<RootStackParamList>;

const PaymentScreen: React.FC = () => {
    const navigation = useNavigation<PaymentScreenNavProp>();
    const route = useRoute<PaymentScreenRouteProp>();
    const paymentUrl = route.params?.paymentUrl;
    const orderId = route.params?.orderId;

    // Handle navigation state change to detect payment success/failure
    const handleNavigationStateChange = useCallback((navState: any) => {
        const { url } = navState;

        console.log('WebView navigation state changed:', url);

        if (!url) return;

        // Check for payment success redirect URL
        // Success: http://13.201.170.46:3000/payment/success?order_id=xxx&success=true
        if (url.includes('/payment/success') && url.includes('success=true')) {
            console.log('Payment successful detected, navigating back to ActiveOrderScreen with orderId:', orderId);

            // Go back to ActiveOrderScreen (which is already in the navigation stack)
            // The ActiveOrderScreen will refresh automatically via useFocusEffect
            navigation.goBack();
            return;
        }

        // Check for payment failure redirect URL
        // Failure: http://13.201.170.46:3000/payment/failure?order_id=xxx&success=false
        if (url.includes('/payment/failure') && url.includes('success=false')) {
            console.log('Payment failed detected');
            // Optionally handle failure - for now, just log it
            // You can show an error message or stay on payment screen
        }
    }, [navigation, orderId]);

    // Handle should start load with request (for iOS)
    const handleShouldStartLoadWithRequest = useCallback((request: any) => {
        const { url } = request;

        console.log('WebView should start load with request:', url);

        if (!url) return true;

        // Check for payment success redirect URL
        // Success: http://13.201.170.46:3000/payment/success?order_id=xxx&success=true
        if (url.includes('/payment/success') && url.includes('success=true')) {
            console.log('Payment successful detected (iOS), navigating back to ActiveOrderScreen with orderId:', orderId);

            // Go back to ActiveOrderScreen (which is already in the navigation stack)
            // The ActiveOrderScreen will refresh automatically via useFocusEffect
            navigation.goBack();
            return false; // Prevent loading the success page
        }

        // Check for payment failure redirect URL
        // Failure: http://13.201.170.46:3000/payment/failure?order_id=xxx&success=false
        if (url.includes('/payment/failure') && url.includes('success=false')) {
            console.log('Payment failed detected (iOS)');
            // Optionally handle failure - allow loading failure page or show error
            return true; // Allow loading failure page
        }

        return true; // Allow normal navigation
    }, [navigation, orderId]);

    if (!paymentUrl) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Payment URL is missing</Text>
            </View>
        );
    }

    return (
        <CustomInAppWebView
            url={paymentUrl}
            headerComponent={<Toolbar title="Payment" showBackIcon={false} />}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            headerTitle="Payment"
        />
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    placeholder: {
        width: 40,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF4136',
        textAlign: 'center',
    },
});

export default PaymentScreen;

