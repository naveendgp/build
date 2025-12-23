import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Toolbar from '../../../components/Toolbar';
import CustomText from '../../../components/Text';
import CustomIcon from '../../../components/Icon';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import SvgLocationLine from '../../../assets/auto-generated-svg-icons/LocationLine';
import SvgForwardRightBlackSvg from '../../../assets/auto-generated-svg-icons/ForwardRightBlackSvg';
import SvgHepSupportIcon from '../../../assets/auto-generated-svg-icons/HepSupportIcon';
import styles from './styles';
import SvgOrderBoxIcon from '../../../assets/auto-generated-svg-icons/OrderBoxIcon';
import SvgHelpSupportIcon from '../../../assets/auto-generated-svg-icons/HelpSupportIcon';
import ItemsDetailBottomsheet, { OrderItem } from '../BottomSheets/ItemsDetailBottomsheet';
import { fetchOrderById } from '../../../apiService/api/ordersApi';
import { VendorOrder } from '../../../apiService/types/ordersTypes';
import { openWhatsApp } from '../../../utils/whatsappUtils';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
import { SafeAreaView } from 'react-native-safe-area-context';

type OrderDetailsRouteProp = RouteProp<RootStackParamList, 'OrderDetails'>;
type OrderDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetails'>;

interface TimelineItem {
    status: string;
    date: string;
    time: string;
    isCompleted?: boolean;
    isActive?: boolean;
}

interface OrderDetailsData {
    orderId: string;
    displayOrderId: string;
    location: string;
    orderType: 'standard' | 'express';
    serviceType: string;
    serviceQuantity?: string;
    serviceWeight?: string;
    timeline: TimelineItem[];
    itemTotal: number;
    gst: number;
    gstPercentage: string;
    grandTotal: number;
    customerName: string;
    offerAmount?: number;
}

const OrderDetailsScreen: React.FC = () => {
    const navigation = useNavigation<OrderDetailsNavProp>();
    const route = useRoute<OrderDetailsRouteProp>();
    const orderId = route.params?.orderId;
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
    const { profile } = useProfileStore();
    // Helper functions to format dates (defined before useMemo)
    const getOrdinalSuffix = (n: number) => {
        const j = n % 10;
        const k = n % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        return `${day}${getOrdinalSuffix(day)} ${month}`;
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Fetch order details from API
    const {
        data: orderResponse,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['orderDetails', orderId],
        queryFn: () => fetchOrderById(orderId!),
        enabled: !!orderId,
    });

    // Get the first order from the response
    const vendorOrder: VendorOrder | undefined = orderResponse?.data?.orders?.[0];

    // Map VendorOrder to OrderDetailsData
    const orderData: OrderDetailsData | null = useMemo(() => {
        if (!vendorOrder) return null;

        // Format address
        const address = vendorOrder.user_address;

        const loc = `${address.city}, ${address.state}`;

        const location = loc || `${address?.address_line1}`;



        // Calculate item total from items
        const itemTotal = vendorOrder.items?.reduce((sum, item) => sum + item.total_price, 0) || 0;

        // Get GST from payment_details
        const gst = vendorOrder.payment_details?.gst || 0;
        const gstPercentage = itemTotal > 0 ? ((gst / itemTotal) * 100).toFixed(0) : '18';

        // Get grand total
        const grandTotal = vendorOrder.payment_details?.amount_to_vendor_after_commission || 0;

        // Get service type from first item
        const firstItem = vendorOrder.items?.[0];
        const serviceType = firstItem?.service_name || 'Service';

        // Calculate total quantity
        const totalQuantity = vendorOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        const displayOrderId = (() => {
            if (!vendorOrder?._id) {
                return '';
            }
            const orderIdStr = vendorOrder?._id.toString();
            return orderIdStr.length <= 5 ? orderIdStr : "......" + orderIdStr.slice(-7);
        })();

        // Build timeline based on status
        const timeline: TimelineItem[] = [];
        const statusTimestamps = vendorOrder.status_timestamps || {};

        if (statusTimestamps.pending || vendorOrder.status === 'pending') {
            timeline.push({
                status: 'Order Received',
                date: formatDate(vendorOrder.created_at),
                time: formatTime(vendorOrder.created_at),
                isCompleted: true,
            });
        }
        if (statusTimestamps.accepted || vendorOrder.status === 'accepted') {
            timeline.push({
                status: 'Order Accepted',
                date: formatDate(statusTimestamps.accepted || vendorOrder.updated_at),
                time: formatTime(statusTimestamps.accepted || vendorOrder.updated_at),
                isCompleted: true,
            });
        }
        if (statusTimestamps.processed || vendorOrder.status === 'processed') {
            timeline.push({
                status: 'Order Processed',
                date: formatDate(statusTimestamps.processed || vendorOrder.updated_at),
                time: formatTime(statusTimestamps.processed || vendorOrder.updated_at),
                isCompleted: true,
            });
        }
        if (statusTimestamps.delivered || vendorOrder.status === 'delivered') {
            timeline.push({
                status: 'Order Delivered',
                date: formatDate(statusTimestamps.delivered || vendorOrder.updated_at),
                time: formatTime(statusTimestamps.delivered || vendorOrder.updated_at),
                isCompleted: true,
            });
        }

        return {
            orderId: vendorOrder._id,
            displayOrderId,
            location,
            orderType: vendorOrder.is_express ? 'express' : 'standard',
            serviceType,
            serviceQuantity: totalQuantity.toString(),
            serviceWeight: vendorOrder.is_express ? `${totalQuantity} kg` : undefined,
            timeline: timeline.length > 0 ? timeline : [
                {
                    status: 'Order Received',
                    date: formatDate(vendorOrder.created_at),
                    time: formatTime(vendorOrder.created_at),
                    isCompleted: true,
                },
            ],
            itemTotal: itemTotal,
            gst: gst,
            gstPercentage,
            grandTotal: grandTotal,
            offerAmount: vendorOrder.payment_details?.offerDiscountAmount,
            customerName: vendorOrder.user?.name || 'Customer',
        };
    }, [vendorOrder, formatDate, formatTime]);

    const handleSupportPress = () => {
        // Handle support action
        console.log('Support pressed');
        openWhatsApp(profile?.support_phone_number || '');
    };

    const handleArrowPress = () => {
        setIsBottomSheetVisible(true);
    };

    const handleCloseBottomSheet = () => {
        setIsBottomSheetVisible(false);
    };

    // Prepare items data for bottom sheet
    const getItemsData = (): OrderItem[] => {
        if (!vendorOrder?.items) return [];

        return vendorOrder.items.map((item, index) => ({
            id: item.item_id || index.toString(),
            type: item.service_name.toLowerCase().includes('iron') ? 'iron' : 'wash',
            itemName: item.item_name,
            category: item.service_name,
            quantity: item.quantity,
            amount: item.price_per_item,
            weight: item.weight,
        }));
    };

    const renderTimelineItem = (item: TimelineItem, index: number, totalItems: number) => {
        const isLast = index === totalItems - 1;
        const isActive = item.isActive;

        return (
            <View key={index} style={styles.timelineItemContainer}>
                <View style={styles.timelineContent}>
                    <View style={styles.timelineIconContainer}>
                        {isActive ? (
                            <View style={styles.activeStatusContainer}>
                                <View style={styles.activeStatusIcon}>
                                    <CustomIcon
                                        type="MaterialCommunityIcons"
                                        name="truck-delivery"
                                        size={20}
                                        color={COLORS.WHITE}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.orderBoxIconContainer}>
                                <SvgOrderBoxIcon />
                            </View>
                        )}
                    </View>
                    <View style={styles.timelineTextContainer}>
                        <CustomText style={styles.timelineStatusText}>{item.status}</CustomText>
                        <CustomText style={styles.timelineDateText}>
                            {item.date}, {item.time}
                        </CustomText>
                    </View>
                </View>
                {!isLast && (
                    <View style={styles.timelineLineContainer}>
                        {[...Array(5)].map((_, index) => (
                            <View key={index} style={styles.timelineDash} />
                        ))}
                    </View>
                )}
            </View>
        );
    };

    // Show loader while fetching
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.toolbarContainer}>
                        <Toolbar
                            title="Order"
                            onBackPress={() => navigation.goBack()}
                        />
                    </View>
                    <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress}>
                        <SvgHelpSupportIcon />
                        <CustomText style={styles.supportText}>Support</CustomText>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (isError || !orderData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.toolbarContainer}>
                        <Toolbar
                            title="Order"
                            onBackPress={() => navigation.goBack()}
                        />
                    </View>
                    <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress}>
                        <SvgHelpSupportIcon />
                        <CustomText style={styles.supportText}>Support</CustomText>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <CustomText style={{ fontSize: 16, color: COLORS.ERROR, textAlign: 'center' }}>
                        {error?.message || 'Failed to load order details. Please try again.'}
                    </CustomText>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.toolbarContainer}>
                    <Toolbar
                        title="Order"
                        onBackPress={() => navigation.goBack()}
                    />
                </View>
                <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress}>
                    <SvgHelpSupportIcon />
                    <CustomText style={styles.supportText}>Support</CustomText>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Standard Service Card */}
                <View style={styles.serviceCard}>
                    <CustomText style={styles.serviceCardTitle}>
                        {orderData.orderType === 'express' ? 'Express Service' : 'Standard Service'}
                    </CustomText>
                    <View style={styles.timelineContainer}>
                        {orderData.timeline.map((item, index) =>
                            renderTimelineItem(item, index, orderData.timeline.length)
                        )}
                    </View>
                </View>

                {/* Order ID and Item Details Card */}
                <View style={styles.orderInfoCard}>
                    <View style={styles.orderIdRow}>
                        <CustomText style={styles.orderIdText}>#{orderData.displayOrderId}</CustomText>
                    </View>
                    <View style={styles.locationRow}>
                        <SvgLocationLine />
                        <CustomText style={styles.locationText}>{orderData.location}</CustomText>
                    </View>
                    <View style={styles.separatorLine} />
                    <View style={styles.itemDetailsRow}>
                        <View style={styles.itemDetailsLeft}>
                            <View style={styles.quantityBadge}>
                                <CustomText style={styles.quantityBadgeText}>
                                    {vendorOrder?.service_type === 2 ? `${orderData.serviceQuantity} kg` : `${orderData.serviceQuantity?.replace(' X', '') || '1'}X`}
                                </CustomText>
                            </View>
                            <TouchableOpacity
                                style={styles.arrowIconContainer}
                                onPress={handleArrowPress}
                                activeOpacity={0.2}
                            >
                                <CustomText style={[styles.serviceTypeText, styles.serviceTypeMargin]}>
                                    {orderData.serviceType}
                                </CustomText>
                                <SvgForwardRightBlackSvg />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.itemDetailsRight}>
                            <CustomText style={styles.itemPrice}>₹{orderData.itemTotal}</CustomText>
                        </View>
                    </View>
                </View>

                {/* Bill Summary Card */}
                <View style={styles.billCard}>
                    <CustomText style={styles.billCardTitle}>Bill Summary</CustomText>
                    <CustomText style={styles.billCardSubtitle}>Incl. All taxes & Charges</CustomText>
                    <View style={styles.billRow}>
                        <CustomText style={styles.billLabel}>Item Total</CustomText>
                        <CustomText style={styles.billValue}>₹{orderData.itemTotal}</CustomText>
                    </View>
                    <View style={styles.billRow}>
                        <CustomText style={styles.billLabelUnderlined}>
                            GST (Govt. Taxes) ₹{orderData.gst} ({profile?.payment_config?.gst_percentage}% of Item Total)
                        </CustomText>
                    </View>

                    {(orderData?.offerAmount || 0) > 0 && <View style={styles.billRow}>
                        <CustomText style={styles.billLabel}>Offer Amount</CustomText>
                        <CustomText style={styles.billValue}>₹{orderData.offerAmount}</CustomText>
                    </View>
                    }

                    <View style={styles.billDivider} />
                    <View style={styles.billRow}>
                        <CustomText style={styles.grandTotalLabel}>Grand Total</CustomText>
                        <CustomText style={styles.grandTotalValue}>₹{orderData.grandTotal}</CustomText>
                    </View>
                </View>

                {/* Customer Detail Card */}
                <View style={styles.customerCard}>
                    <CustomText style={styles.customerCardTitle}>Customer Detail</CustomText>
                    <View style={styles.customerRow}>
                        <CustomText style={styles.customerLabel}>Name</CustomText>
                        <CustomText style={styles.customerValue}>{orderData.customerName}</CustomText>
                    </View>
                </View>
            </ScrollView>

            {/* Items Detail Bottom Sheet */}
            <ItemsDetailBottomsheet
                isVisible={isBottomSheetVisible}
                onClose={handleCloseBottomSheet}
                title={`${orderData.serviceType} Item Details`}
                items={getItemsData()}
                isWeightBased={vendorOrder?.service_type === 2 ? true : false}
                isVerified={true}
            />
        </SafeAreaView>
    );
};

export default OrderDetailsScreen;

