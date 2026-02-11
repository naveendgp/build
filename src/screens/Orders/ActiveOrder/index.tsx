import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Image,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import MapView, { Marker, Polyline } from 'react-native-maps';
import CustomText from '../../../components/Text';
import { COLORS } from '../../../constants/colors';
import { FONTFAMILY } from '../../../constants/fonts';
import CustomIcon from '../../../components/Icon';
import BackIcon from '../../../assets/auto-generated-svg-icons/BackIcon';
import Toolbar, { toolbarStyles } from '../../../components/Toolbar';
import TimeLineCard from '../component/TimeLineCard';
import BillSummaryCard from '../component/BillSummaryCard';
import CustomBtn from '../../../components/CustomBtn';
import socket from '../../../services/Socket/socket';
import { SOCKET_ENDPOINTS } from '../../../constants';
import { ordersHistoryService } from '../../../services/ordersHistoryService';
import { Order, OrderStatus } from '../../../types/order/order';
import { useOrderTimeline } from './hooks/useOrderTimeline';
import SvgLeftArrowWhiteIcon from '../../../assets/auto-generated-svg-icons/LeftArrowWhiteIcon';
import SvgSupportMsgIcon from '../../../assets/auto-generated-svg-icons/SupportMsgIcon';
import SvgRefreshIcon from '../../../assets/auto-generated-svg-icons/RefreshIcon';
import WashingIcon from '../../../assets/auto-generated-svg-icons/ActiveOrderImage';
import PaymentOptions from '../component/PaymentOptions';
import { showErrorToast, showSuccessToast } from '../../../components/Toast/Toast';
import { TripType, UserToVendorStatus } from '../../../constants/tripStatus';
import CustomDialog from '../../../components/CustomDialog';
import { openWhatsApp } from '../../../utils';
import { orderService } from '../../../services/orderService';
import { useCommonStore } from '../../../state/zustand/commonStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDirections, Coordinate } from '../../../utils/mapUtils';
import VendorMarker from '../../../../src/assets/auto-generated-svg-icons/VendorMarker';
import RiderMarker from '../../../../src/assets/auto-generated-svg-icons/RiderMarker';
import UserMarker from '../../../../src/assets/auto-generated-svg-icons/UserMarker';



type ActiveOrderRouteProp = RouteProp<RootStackParamList, 'ActiveOrderScreen'>;
type ActiveOrderNavProp = NativeStackNavigationProp<RootStackParamList>;

interface BillItem {
    label: string;
    amount: number;
}

const ActiveOrderScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ActiveOrderNavProp>();
    const route = useRoute<ActiveOrderRouteProp>();
    const orderId = route.params?.orderId;
    const [orderData, setOrderData] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isorderNotAccepted, setOrderNotAccepted] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isHideMap, setHideMap] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
    const [liveDriverLocation, setLiveDriverLocation] = useState<Coordinate | null>(null);

    const { profile } = useCommonStore();


    // Derive values from orderData
    const shopName = orderData?.vendor?.shop_name || '';
    const shopLocation = orderData?.vendor_address ? {
        latitude: orderData.vendor_address.latitude,
        longitude: orderData.vendor_address.longitude,
    } : { latitude: 0, longitude: 0 };

    // Rider location might not be available in order data, using user address as fallback
    const riderLocation = orderData?.user_address ? {
        latitude: orderData?.user_address?.latitude ?? 0,
        longitude: orderData?.user_address?.longitude ?? 0,
    } : { latitude: 0, longitude: 0 };


    // Fetch route when locations change
    useEffect(() => {
        const fetchRoute = async () => {
            let startPoint = shopLocation;
            let endPoint = riderLocation;

            // Logic for Trip Type 1 (User -> Vendor)
            if (orderData?.trip_type === 1 && liveDriverLocation) {
                const status = orderData?.status_type;

                if (status === 3) {
                    // Status 3 (Driver Assigned): Driver -> User
                    startPoint = liveDriverLocation;
                    endPoint = riderLocation;
                } else if (status === 6) {
                    // Status 6 (OTP Confirmation/Pickup): Driver -> Shop
                    startPoint = liveDriverLocation;
                    endPoint = shopLocation;
                }
            } else if (orderData?.trip_type === 2 && liveDriverLocation) {
                // Logic for Trip Type 2 (Vendor -> User)
                const status = orderData?.status_type;
                if (status === 5) {
                    // Status 5: Driver -> User
                    startPoint = liveDriverLocation;
                    endPoint = riderLocation;
                }
            }

            console.log('---------------------')
            console.log('📍 Start Point:', startPoint);
            console.log('📍 End Point:', endPoint);

            // Validate points before fetching
            if (startPoint?.latitude && startPoint?.latitude !== 0 &&
                endPoint?.latitude && endPoint?.latitude !== 0) {

                const points = await getDirections(startPoint, endPoint);
                if (points.length > 0) {
                    setRouteCoordinates(points);
                } else {
                    setRouteCoordinates([startPoint, endPoint]);
                }
            }
        };

        fetchRoute();
    }, [shopLocation.latitude, shopLocation.longitude, riderLocation.latitude, riderLocation.longitude, liveDriverLocation, orderData?.status_type]);

    // Generate timeline events from updateLogs using custom hook
    const timelineEvents = useOrderTimeline(orderData);

    // Calculate ETA (placeholder - you may want to calculate this based on order status)
    const eta = orderData ? '45' : '0';
    const lastRefresh = 'just now';
    const toPay = orderData?.payment_details?.totalPayableAmount || 0;

    // Fetch order details function
    const fetchOrderDetails = React.useCallback(async (showLoading: boolean = true) => {
        if (!orderId) {
            setError('Order ID is required');
            setIsLoading(false);
            return;
        }

        if (showLoading) {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await ordersHistoryService.getOrderById(orderId);
            if (response.success && response.data?.data?.order) {
                const order_status = response.data.data.order.status_type;

                if (response.data.data.order.trip_type === TripType.USER_TO_VENDOR) {
                    if (order_status === UserToVendorStatus.VENDOR_REJECTED || order_status === UserToVendorStatus.VENDOR_UN_ACCEPTED) {
                        setOrderNotAccepted(true);
                    }
                }

                setOrderData(response.data.data.order);
                console.log('Order data:', response.data.data.order);
            } else {
                setError(response.error || 'Failed to fetch order details');
                console.error('Failed to fetch order:', response.error);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            console.error('Error fetching order details:', err);
        } finally {
            if (showLoading) {
                setIsLoading(false);
            }
        }
    }, [orderId]);

    // Control Map Visibility based on specific tracking states
    useEffect(() => {
        const status = orderData?.status_type;
        const tripType = orderData?.trip_type;
        // const hasLiveLocation = !!liveDriverLocation;
        console.log('🔍 Checking Map Visibility:', { status, tripType, liveLocation: !!liveDriverLocation });

        let shouldShowMap = false;

        // Trip 1 (Start -> Vendor): Show for Status 3 (Driver Assigned) or 6 (OTP/Pickup)
        if (tripType === 1 && (status === 3 || status === 6)) {
            shouldShowMap = true;
        }
        // Trip 2 (Vendor -> User): Show for Status 5 (Driver Reached/Approaching User?)
        else if (tripType === 2 && status === 5) {
            shouldShowMap = true;
        }

        // Only show setHideMap(false) in these cases; otherwise hide map
        console.log('🗺️ Should Show Map?', shouldShowMap);
        setHideMap(!shouldShowMap);

    }, [orderData?.status_type, orderData?.trip_type, liveDriverLocation]);

    // Fetch order details on mount
    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    const handleCallRider = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handlePayOnline = async () => {
        if (!orderId) {
            showErrorToast('Order ID is missing');
            return;
        }

        setIsProcessingPayment(true);
        try {
            const response = await orderService.makePayment(orderId);

            if (response.success && response.data?.data?.paymentLink) {
                const paymentLink = response.data.data.paymentLink;

                // Navigate to payment screen with payment URL and orderId
                navigation.navigate('PaymentScreen', {
                    paymentUrl: paymentLink,
                    orderId: orderId
                });
            } else {
                const errorMessage = response.error || response.message || 'Failed to create payment link';
                showErrorToast(errorMessage);
            }
        } catch (error) {
            console.error('Payment error:', error);
            showErrorToast('An error occurred while processing payment. Please try again.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleCashOnDelivery = useCallback(async () => {
        if (!orderId) {
            showErrorToast('Order ID is missing');
            return;
        }

        try {
            const response = await orderService.changePaymentMethod({
                order_id: orderId,
                payment_method: 1
            });

            if (response.success) {
                showSuccessToast(response.data?.message || 'Payment method changed to Cash On Delivery');
                fetchOrderDetails();
            } else {
                showErrorToast(response.error || response.message || 'Failed to change payment method');
            }
        } catch (error) {
            console.error('Error changing payment method:', error);
            showErrorToast('An error occurred. Please try again.');
        }
    }, [orderId, fetchOrderDetails]);






    // Initialize socket event listeners when screen is focused
    // useFocusEffect(
    //     React.useCallback(() => {
    //         const sock = socket.getSocket();

    //         if (!sock?.connected) {
    //             socket.connect().catch(err => console.error('Failed to connect socket:', err));
    //         }

    //         const handleData = (data: any) => {
    //             console.log('Received datafrom socket:', data);
    //             fetchOrderDetails();
    //         };

    //         socket.on(SOCKET_ENDPOINTS.ORDER_STATUS, handleData);

    //         return () => {
    //             socket.off(SOCKET_ENDPOINTS.ORDER_STATUS, handleData);
    //         };
    //     }, [orderId, fetchOrderDetails])
    // );

    useFocusEffect(
        React.useCallback(() => {
            fetchOrderDetails(false);
        }, [])
    )

    useFocusEffect(
        React.useCallback(() => {
            const sock = socket.getSocket();

            console.log('🧪 Connected?', sock?.connected);

            const joinOrderRoom = () => {
                console.log('🔗 Joining order room:', orderId);
                sock?.emit('join-order', { orderId });
            };

            const onOrderStatus = (data: any) => {
                console.log('📩 ORDER_STATUS:', data);
                fetchOrderDetails(false);
            };

            const onUserLocationUpdates = (data: any) => {
                console.log('📍 USER_LOCATION_UPDATES:', data);
                // Check if trip_type is 1 (Pickup) and status is accepted
                if ((data?.trip_type === 1 && (data?.status_type === 3 || data?.status_type === 6)) || (data?.trip_type === 2 && data?.status_type === 5) && data?.driver_location) {

                    fetchOrderDetails(false);
                    setLiveDriverLocation({
                        latitude: data.driver_location.latitude,
                        longitude: data.driver_location.longitude
                    });
                }
            };

            // 🔥 CASE 1: already connected
            if (sock?.connected) {
                joinOrderRoom();
            }

            // 🔥 CASE 2: connects later
            sock?.on('connect', joinOrderRoom);

            sock?.on(SOCKET_ENDPOINTS.ORDER_STATUS, onOrderStatus);
            sock?.on('user-location-updates', onUserLocationUpdates);

            return () => {
                sock?.off('connect', joinOrderRoom);
                sock?.off(SOCKET_ENDPOINTS.ORDER_STATUS, onOrderStatus);
                sock?.off('user-location-updates', onUserLocationUpdates);
            };
        }, [orderId])
    );









    const handleRefreshETA = () => {
        // Handle refresh ETA logic
        console.log('Refreshing ETA...');
    };

    const handlePullToRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrderDetails(false);
        setRefreshing(false);
    }, [fetchOrderDetails]);

    const handleSupportPress = () => {
        // Handle support button press
        openWhatsApp(profile?.support_phone_number || '', orderData?._id);
    };

    // Show loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
                    <CustomText style={{ marginTop: 12, color: COLORS.TEXT_GRAY }}>
                        Loading order details...
                    </CustomText>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <CustomText style={{ color: COLORS.ERROR, textAlign: 'center', marginBottom: 16 }}>
                        {error}
                    </CustomText>
                    <TouchableOpacity
                        onPress={() => {
                            if (orderId) {
                                fetchOrderDetails(true);
                            }
                        }}
                        style={{
                            backgroundColor: COLORS.THEME_GREEN,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 8,
                        }}
                    >
                        <CustomText style={{ color: COLORS.WHITE }}>Retry</CustomText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Show error if no orderId
    if (!orderId) {
        return (
            <View style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <CustomText style={{ color: COLORS.ERROR, textAlign: 'center', marginBottom: 16 }}>
                        Order ID is required
                    </CustomText>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            backgroundColor: COLORS.THEME_GREEN,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 8,
                        }}
                    >
                        <CustomText style={{ color: COLORS.WHITE }}>Go Back</CustomText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingBottom: Platform.OS === 'android' ? insets.bottom : insets.bottom + 16 }]}>
            {/* Header Section */}
            <StatusBar barStyle="light-content" />
            <View style={{ backgroundColor: COLORS.TEXT_PRIMARY, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top }}>
                <TouchableOpacity
                    style={{ paddingVertical: 20, paddingHorizontal: 8 }}
                    onPress={(() => navigation.goBack())}
                >

                    <SvgLeftArrowWhiteIcon />

                </TouchableOpacity>

                <TouchableOpacity
                    style={{ paddingEnd: 12, flexDirection: 'row', alignItems: 'center' }}
                    onPress={handleSupportPress}
                >
                    <SvgSupportMsgIcon />
                    <CustomText style={{
                        fontSize: 14,
                        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
                        fontWeight: "700",
                        color: COLORS.CARD_BACKGROUND,
                        marginLeft: 6,
                    }}>Support</CustomText>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: Platform.OS === 'android' ? 200 : insets.bottom + 16 }
                ]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handlePullToRefresh} />
                }
            >
                <View style={styles.headerContainer}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTextContainer}>
                            <CustomText style={styles.shopName} >
                                {shopName}
                            </CustomText>
                            <CustomText style={styles.orderId}>
                                Order ID: {orderData?.order_number}
                            </CustomText>
                        </View>

                        {/* ETA Section */}
                        {/* <View style={styles.etaContainer}>
                            <View style={styles.etaRow}>
                                <View style={styles.etaCard}>
                                    <CustomText style={styles.etaText}>ETA - {eta} mins</CustomText>
                                </View>
                                <TouchableOpacity
                                    onPress={handleRefreshETA}
                                    style={styles.refreshButtonContainer}
                                >

                                    <SvgRefreshIcon />
                                </TouchableOpacity>
                            </View>
                            <CustomText style={styles.refreshText}>
                                Refreshed {lastRefresh}
                            </CustomText>
                        </View> */}
                    </View>


                    <WashingIcon style={{ position: 'absolute', right: 0, top: 0 }} />


                </View>

                {/* <CustomDialog
                    visible={showDeleteDialog}
                    title="Delete Address"
                    content={"Order has been not accepted by the vendor"}
                    onClose={() => {

                    }}
                    onConfirm={() => navigation.goBack()}
                    confirmText="Back to Home"
                /> */}

                {/* Map Section */}
                {!isHideMap && <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={orderData ? {
                            latitude: (shopLocation.latitude + riderLocation.latitude) / 2,
                            longitude: (shopLocation.longitude + riderLocation.longitude) / 2,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        } : {
                            latitude: 12.9716,
                            longitude: 77.5946,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        mapType="standard"
                    >
                        {/* Show Driver Marker if live tracking is active, otherwise Shop Marker? 
                            Or both? Usually if driver is en route, we show Driver. 
                            Let's keep Shop marker always as base, and add Driver marker when active.
                        */}
                        {liveDriverLocation && (
                            <Marker
                                coordinate={liveDriverLocation}
                                title="Driver"
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <RiderMarker />
                            </Marker>
                        )}

                        {/* Shop Marker - Maybe hide if driver is active? User didn't specify, but let's keep it contextually.
                            If tracking Driver -> User, Shop might be irrelevant or confusing if far away.
                            But usually good to see context.
                        */}
                        <Marker
                            coordinate={shopLocation}
                            title="Shop"
                            pinColor="red"
                        >
                            <VendorMarker />

                        </Marker>

                        {/* User Marker (Destination) */}
                        <Marker coordinate={riderLocation} title="User">
                            <UserMarker />
                        </Marker>

                        {/* User Marker */}
                        <Marker coordinate={riderLocation} title="User">
                            <UserMarker />
                        </Marker>

                        {/* Route Line */}
                        {routeCoordinates.length > 0 && (
                            <Polyline
                                coordinates={routeCoordinates}
                                strokeColor="#1562BB"
                                strokeWidth={4}
                            />
                        )}
                    </MapView>
                </View>
                }
                {/* Pickup Timeline Section */}
                <View style={styles.timelineContainer}>
                    <CustomText style={styles.sectionTitle} fontWeight="Bold">
                        {
                            orderData?.status_type === 8
                                ? 'Drop'
                                : orderData?.trip_type === 1
                                    ? 'Pickup'
                                    : 'Drop'
                        }
                    </CustomText>

                    {timelineEvents.map((event, index) => (
                        <TimeLineCard
                            key={event.id}
                            date={event.date}
                            time={event.time}
                            title={event.title}
                            icon={event.icon}
                            iconType={event.iconType}
                            note={(index === 0 && orderData?.trip_type === 1 && orderData?.status_type !== 8) ? 'Note: order cannot be canceled after accepted by the shop' : ''}
                            showCallButton={event.showCallButton}
                            onCallPress={handleCallRider}
                            otp={event.showOtp ? event.otp : undefined}
                            showTimelineLine={index < timelineEvents.length - 1}
                            riderName={event.riderName}
                            riderPhone={event.riderPhone}
                            status={event.status}
                        />
                    ))}
                </View>

                {(() => {
                    const status = orderData?.status || "";
                    const item = orderData?.items?.[0];
                    const isVerified = orderData?.is_verified;
                    const hideStatuses = ["pending", "unaccepted", "cancelled"];

                    // 1) If status is in the hide list -> don't show
                    if (hideStatuses.includes(status)) return null;

                    // 2) If item_category is present -> it's a weight item and must be verified
                    const hasItemCategory = typeof item?.item_category !== "undefined";
                    if (hasItemCategory) {
                        if (item.item_category === "weight") {
                            if (!isVerified) return null; // weight items require verification
                        }
                        // if item_category exists but isn't "weight", fallthrough to show
                    }
                    // 3) If item_category is not present -> it's a non-weight item -> show
                    // 4) Also handles case where items array is empty (no item) -> treat as non-weight and show
                    const isWeightItem = hasItemCategory && item.item_category === "weight";
                    const weight = item?.weight
                    const wightPrice = item?.price_per_item

                    return (
                        <BillSummaryCard
                            subtitle="Incl. All taxes & Charges"
                            billItems={[
                                { label: (isWeightItem ? `Item Total (${weight}kg x ₹${wightPrice}/kg)` : "Item Total"), amount: orderData?.payment_details?.item_total || 0 },
                                { label: "Delivery Fee", amount: orderData?.payment_details?.delivery_fee || 0 },
                                { label: "Platform Fee", amount: orderData?.payment_details?.amount_to_platform || 0 },
                                { label: "GST", amount: orderData?.payment_details?.gst || 0 },
                            ]}
                            grandTotal={orderData?.payment_details?.grand_total || 0}
                            offer={orderData?.payment_details?.offerDiscountAmount || 0}
                            cashRoundOff={0.99900}
                            toPay={orderData?.payment_details?.totalPayableAmount || 0}
                        />
                    );
                })()}








                {(orderData?.payment_details?.is_payment_eligible || orderData?.status === "pending") ? <PaymentOptions
                    amount={orderData?.payment_details?.totalPayableAmount || 0}
                    onCashOnDeliveryPress={handleCashOnDelivery}
                    onPayOnlinePress={handlePayOnline}
                    isOrderAccepted={orderData?.status !== "pending"}
                    orderId={orderId}
                    onOrderCancelled={() => {
                        // Refresh order details after cancellation
                        fetchOrderDetails();
                    }}
                    navigation={navigation}
                /> : null}







            </ScrollView>
        </View>
    );
};

export default ActiveOrderScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    scrollContent: {
        paddingBottom: 16,
    },
    headerContainer: {
        backgroundColor: COLORS.TEXT_PRIMARY,
        paddingTop: 23,
        paddingBottom: 16,
        position: 'relative',

        justifyContent: 'center',
    },
    headerContent: {
        flexDirection: 'column',
        paddingStart: 12
    },
    headerTextContainer: {
        marginBottom: 12,
    },
    shopName: {
        fontSize: 20,
        color: COLORS.WHITE,
        fontFamily: FONTFAMILY.INTER_BOLD,
        marginBottom: 4,
        fontWeight: "700",
    },
    orderId: {
        fontSize: 14,
        color: COLORS.NOTE_TEXT,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: "400",
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    supportText: {
        fontSize: 14,
        color: COLORS.WHITE,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        marginLeft: 4,
    },
    etaContainer: {
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    etaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    etaCard: {
        backgroundColor: COLORS.INPUT_TEXT,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginRight: 8,
    },
    etaText: {
        fontSize: 14,
        color: COLORS.BUTTON_BACKGROUND,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: "500",
    },
    refreshButtonContainer: {
        backgroundColor: COLORS.INPUT_TEXT,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshButton: {
        padding: 4,
    },
    refreshText: {
        fontSize: 12,
        color: '#BABABA',
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: "400",
        marginLeft: 0,
    },
    illustrationContainer: {
        position: 'absolute',
        right: 16,
        top: 80,
        width: 120,
        height: 120,
    },
    illustrationPlaceholder: {
        width: 150,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',

    },
    mapContainer: {
        height: 300,
        backgroundColor: COLORS.LIGHT_GRAY_3,
        marginTop: 0,
    },
    map: {
        flex: 1,
    },
    shopMarker: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: COLORS.RED,
    },
    riderMarker: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: '#4220BE',
    },
    timelineContainer: {
        padding: 16,
        backgroundColor: COLORS.BUTTON_BACKGROUND,
        marginHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        marginVertical: 24
    },
    sectionTitle: {
        fontSize: 20,
        color: COLORS.TEXT_PRIMARY,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        marginBottom: 16,
        fontWeight: "700",
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timelineLeft: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: COLORS.DASHED_BORDER,
        marginTop: 8,
        marginBottom: 8,
        opacity: 0.5,
    },
    timelineContent: {
        flex: 1,
    },
    eventCard: {
        backgroundColor: COLORS.LIGHT_GRAY_3,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    eventHeader: {
        marginBottom: 8,
    },
    eventTime: {
        fontSize: 12,
        color: COLORS.GRAY,
        fontFamily: FONTFAMILY.INTER_REGULAR,
    },
    eventTitle: {
        fontSize: 14,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        marginBottom: 8,
    },
    otpText: {
        fontSize: 14,
        color: COLORS.ACCENT,
        fontFamily: FONTFAMILY.INTER_BOLD,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.ACCENT,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    callButtonText: {
        fontSize: 14,
        color: COLORS.WHITE,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        marginLeft: 8,
    },
    noteText: {
        fontSize: 12,
        color: COLORS.NOTE_TEXT,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        marginTop: 8,
        fontStyle: 'italic',
    },
    billContainer: {
        padding: 16,
        backgroundColor: COLORS.WHITE,
    },
    billSubtitle: {
        fontSize: 12,
        color: COLORS.GRAY,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        marginBottom: 16,
    },
    billItems: {
        marginBottom: 12,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    billLabel: {
        fontSize: 14,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_REGULAR,
    },
    billAmount: {
        fontSize: 14,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_REGULAR,
    },
    billDivider: {
        height: 1,
        backgroundColor: COLORS.BORDER,
        marginVertical: 12,
    },
    billOfferLabel: {
        fontSize: 14,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_REGULAR,
    },
    billOfferAmount: {
        fontSize: 14,
        color: COLORS.DISCOUNT_TEXT,
        fontFamily: FONTFAMILY.INTER_REGULAR,
    },
    billToPayLabel: {
        fontSize: 16,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_BOLD,
    },
    billToPayAmount: {
        fontSize: 18,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_BOLD,
    },
});

