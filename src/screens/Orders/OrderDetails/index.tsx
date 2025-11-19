import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
    location: string;
    orderType: 'standard' | 'express';
    serviceType: string;
    serviceQuantity?: string;
    serviceWeight?: string;
    timeline: TimelineItem[];
    itemTotal: string;
    gst: string;
    gstPercentage: string;
    grandTotal: string;
    customerName: string;
}

const OrderDetailsScreen: React.FC = () => {
    const navigation = useNavigation<OrderDetailsNavProp>();
    const route = useRoute<OrderDetailsRouteProp>();
    const order = route.params?.order;
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

    // Default data structure - in real app, this would come from route params
    const orderData: OrderDetailsData = order || {
        orderId: '1234567',
        location: 'Tambaram, chennai',
        orderType: 'standard',
        serviceType: 'Iron',
        serviceQuantity: '15',
        timeline: [
            {
                status: 'Order Received',
                date: '14th Oct',
                time: '4:24 PM',
                isCompleted: true,
            },
            {
                status: 'Order Picked up',
                date: '12th Oct',
                time: '4:24 AM',
                isCompleted: true,
            },
            {
                status: 'Out for delivery',
                date: '14th Oct',
                time: '4:24 PM',
                isActive: true,
            },
        ],
        itemTotal: '200',
        gst: '36',
        gstPercentage: '18',
        grandTotal: '236',
        customerName: 'Srivathsan',
    };

    const handleSupportPress = () => {
        // Handle support action
        console.log('Support pressed');
    };

    const handleArrowPress = () => {
        setIsBottomSheetVisible(true);
    };

    const handleCloseBottomSheet = () => {
        setIsBottomSheetVisible(false);
    };

    // Prepare items data for bottom sheet
    const getItemsData = (): OrderItem[] => {
        const quantity = orderData.orderType === 'express'
            ? parseInt(orderData.serviceWeight?.split(' ')[0] || '1')
            : parseInt(orderData.serviceQuantity?.replace(' X', '') || '1');

        const itemPrice = parseFloat(orderData.itemTotal) / quantity;

        return [{
            id: '1',
            type:'wash',
            itemName: orderData.serviceType,
            category: orderData.serviceType,
            quantity: quantity,
            amount: itemPrice,
        },
            {
                id: '2',
                type: orderData.serviceType.toLowerCase().includes('iron') ? 'iron' : 'wash',
                itemName: orderData.serviceType,
                category: orderData.serviceType,
                quantity: quantity,
                amount: itemPrice,
            },
            {
                id: '3',
                type: orderData.serviceType.toLowerCase().includes('iron') ? 'iron' : 'wash',
                itemName: orderData.serviceType,
                category: orderData.serviceType,
                quantity: quantity,
                amount: itemPrice,
            },
            {
                id: '3',
                type: orderData.serviceType.toLowerCase().includes('iron') ? 'iron' : 'wash',
                itemName: orderData.serviceType,
                category: orderData.serviceType,
                quantity: quantity,
                amount: itemPrice,
            }, {
                id: '3',
                type: orderData.serviceType.toLowerCase().includes('iron') ? 'iron' : 'wash',
                itemName: orderData.serviceType,
                category: orderData.serviceType,
                quantity: quantity,
                amount: itemPrice,
            }, {
                id: '3',
                type: orderData.serviceType.toLowerCase().includes('iron') ? 'iron' : 'wash',
                itemName: orderData.serviceType,
                category: orderData.serviceType,
                quantity: quantity,
                amount: itemPrice,
            }];
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

    return (
        <View style={styles.container}>
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
                        <CustomText style={styles.orderIdText}>#{orderData.orderId}</CustomText>
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
                                    {orderData.orderType === 'express'
                                        ? `${orderData.serviceWeight?.split(' ')[0] || '15'} X`
                                        : `${orderData.serviceQuantity?.replace(' X', '') || '1'}X`}
                                </CustomText>
                            </View>
                            <CustomText style={[styles.serviceTypeText, styles.serviceTypeMargin]}>
                                {orderData.serviceType}
                            </CustomText>
                            <TouchableOpacity
                                style={styles.arrowIconContainer}
                                onPress={handleArrowPress}
                                activeOpacity={0.7}
                            >
                                <SvgForwardRightBlackSvg />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.itemDetailsRight}>
                            <CustomText style={styles.itemPrice}>₹{orderData.itemTotal}.00</CustomText>
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
                            GST (Govt. Taxes) ₹{orderData.gst} ({orderData.gstPercentage}% of Item Total)
                        </CustomText>
                        <CustomText style={styles.billValue}>₹{orderData.gst}</CustomText>
                    </View>
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
            />
        </View>
    );
};

export default OrderDetailsScreen;

