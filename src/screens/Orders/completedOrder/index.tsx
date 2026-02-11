import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform, PermissionsAndroid } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import LinearGradient from "react-native-linear-gradient";
import { styles } from "./style";
import CustomText from "../../../components/Text";
import { COLORS } from "../../../constants";
import Toolbar from "../../../components/Toolbar";
import BillSummaryCard from "../component/BillSummaryCard";
import ItemsDetailBottomsheet, { OrderItem } from "../BttomSheets/ItemsDetailBottomsheet";
import RatingBottomSheet from "../BttomSheets/RatingBottomSheet";
import { ordersHistoryService } from "../../../services/ordersHistoryService";
import { Order } from "../../../types/order/order";

type CompletedOrderRouteProp = RouteProp<RootStackParamList, 'CompletedOrderDetailsScreen'>;
import SvgLocationLineBlackIcon from "../../../assets/auto-generated-svg-icons/LocationLineBlackIcon";
import SvgUnselectedOrdersIcon from "../../../assets/auto-generated-svg-icons/UnselectedOrdersIcon";
import SvgLocationLine from "../../../assets/auto-generated-svg-icons/LocationLine";
import SvgStarIcon from "../../../assets/auto-generated-svg-icons/StarIcon";
import SvgLocation20Icon from "../../../assets/auto-generated-svg-icons/Location20Icon";
import SvgPaymentIcon from "../../../assets/auto-generated-svg-icons/PaymentIcon";
import InvoiceDownloadIcon from "../../../assets/auto-generated-svg-icons/InvoiceDownload";
import { showSuccessToast, showErrorToast } from "../../../components/Toast/Toast";
import BackgroundGradient from "../../../components/backgroundGradient";

import ReactNativeBlobUtil from 'react-native-blob-util';
import { SafeAreaView } from "react-native-safe-area-context";

const CompletedOrderDetailsScreen = () => {
    const route = useRoute<CompletedOrderRouteProp>();
    const orderId = route.params?.orderId;
    const [isVisible, setIsVisible] = useState(false);
    const [isRatingVisible, setIsRatingVisible] = useState(false);
    const [orderData, setOrderData] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    // Fetch order details
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (orderId) {
                try {
                    const response = await ordersHistoryService.getOrderById(orderId);
                    if (response.success && response.data?.data?.order) {
                        // User will handle the response
                        setOrderData(response.data.data.order);
                        console.log('Order data:', response.data.data.order);
                    } else {
                        console.error('Failed to fetch order:', response.error);
                    }
                } catch (error) {
                    console.error('Error fetching order details:', error);
                }
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    useEffect(() => {
        if (orderData && orderData.items) {
            const mappedItems: OrderItem[] = orderData.items.map(item => {
                // Determine type based on service name
                // Iron and Dry Clean use OrderedIronCard (type: 'iron')
                // Wash and Iron and Wash and Fold use OrderWashCard (type: 'wash')
                const serviceName = item.service_name.toLowerCase().trim();
                let itemType: 'iron' | 'wash';

                // Check for wash services first (since "wash and iron" contains "iron")
                if (serviceName.includes('wash and iron') || serviceName.includes('wash and fold') || serviceName.includes('wash & iron') || serviceName.includes('wash & fold')) {
                    itemType = 'wash';
                }
                // Then check for iron-only services
                else if (serviceName === 'iron' || serviceName === 'dry clean' || serviceName.includes('dry clean')) {
                    itemType = 'iron';
                }
                // Fallback: check if it contains 'iron' (but not 'wash and iron' which was already handled)
                else if (serviceName.includes('iron')) {
                    itemType = 'iron';
                }
                // Default to wash for any other service
                else {
                    itemType = 'iron';
                }

                return {
                    id: item.item_id,
                    type: itemType,
                    itemName: item.item_name,
                    category: item.service_name,
                    quantity: item.quantity,
                    amount: item.price_per_item,
                    weight: item?.weight,
                };
            });
            setOrderItems(mappedItems);
        } else {
            setOrderItems([]);
        }
    }, [orderData]);

    // Calculate total items count and service types
    const { totalItemsCount, serviceTypes, hasWeightCategory, wightPrice } = useMemo(() => {
        if (!orderData?.items || orderData.items.length === 0) {
            return { totalItemsCount: 0, serviceTypes: [], hasWeightCategory: false };
        }
        const hasWeight = orderData.items.some(item => item.item_category?.toLowerCase() === 'weight');

        const wightPrice = orderData.items.find(item => item.item_category?.toLowerCase() === 'weight')?.price_per_item || 0;


        const totalCount = hasWeight ? orderData.items.reduce((sum, item) => sum + item.weight, 0) : orderData.items.reduce((sum, item) => sum + item.quantity, 0);
        const uniqueServices = Array.from(new Set(orderData.items.map(item => item.service_name)));

        return {
            totalItemsCount: totalCount,
            serviceTypes: uniqueServices,
            hasWeightCategory: hasWeight,
            wightPrice: wightPrice
        };
    }, [orderData]);

    // Get the first service name for rating
    const firstServiceName = useMemo(() => {
        if (orderData?.items && orderData.items.length > 0) {
            return orderData.items[0].service_name;
        }
        return "Service";
    }, [orderData]);

    const handleRatingSubmit = async (rating: number, comment: string) => {
        // After successful submission, refresh order data to update rating_given
        if (orderId) {
            try {
                const response = await ordersHistoryService.getOrderById(orderId);
                if (response.success && response.data?.data?.order) {
                    setOrderData(response.data.data.order);
                }
            } catch (error) {
                console.error("Error refreshing order data:", error);
            }
        }
    };



    const downloadInvoice = async (url: string) => {
        try {
            const fileName = `otter_invoice_${orderData?._id}.pdf`;

            if (Platform.OS === 'android') {
                ReactNativeBlobUtil.config({
                    fileCache: false,
                    addAndroidDownloads: {
                        useDownloadManager: true,
                        notification: true,
                        path: `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`,
                        description: 'Downloading invoice',
                        mime: 'application/pdf',
                        title: fileName,
                        mediaScannable: true,
                    },
                })
                    .fetch('GET', url)
                    .then(() => {
                        showSuccessToast('Invoice download started');
                    })
                    .catch(err => {
                        console.error('Download error', err);
                        showErrorToast('Download failed');
                    });

                return;
            }

            // 🍎 iOS
            const iosPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
            await ReactNativeBlobUtil.config({
                path: iosPath,
                fileCache: true,
            }).fetch('GET', url);

            showSuccessToast('Invoice saved to Files app');

        } catch (e) {
            console.error('Download failed', e);
            showErrorToast('Download failed');
        }
    };




    // Format date helper
    const formatOrderDate = (timestamp: string | undefined) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        // Format: 14th Oct, 4:24 PM
        const day = date.getDate();
        const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3) || (day - (day % 10) === 10) ? 0 : day % 10];
        const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace(day.toString(), `${day}${suffix}`);
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${formattedDate}, ${time}`;
    };

    return (
        <SafeAreaView edges={['bottom']} style={[styles.container,]}>
            <BackgroundGradient />
            <View
                style={styles.gradient}
            >
                <Toolbar title="Order Details" />

                <ScrollView showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: 100
                    }}
                >
                    {/* Header */}


                    {/* Order Status */}
                    <View style={[styles.card, { paddingBottom: 4 }]}>
                        <CustomText style={styles.sectionTitle}>Order Status</CustomText>

                        <View style={styles.statusWrapper}>
                            {orderData?.status_timestamps?.delivered_at && (
                                <View style={styles.statusContainer}>
                                    <View style={styles.statusRow}>
                                        <SvgLocationLineBlackIcon width={24} height={24} />
                                        <CustomText style={styles.statusTitle}>Order Delivered</CustomText>
                                    </View>
                                    <CustomText style={styles.statusTime}>{formatOrderDate(orderData?.status_timestamps?.delivered_at)}</CustomText>
                                </View>
                            )}

                            {orderData?.status_timestamps?.delivered_at && orderData?.status_timestamps?.picked_up_at && (
                                <View style={styles.verticalDottedLine}>
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <View key={index} style={styles.dot} />
                                    ))}
                                </View>
                            )}

                            {orderData?.status_timestamps?.picked_up_at && (
                                <View style={[styles.statusContainer, { marginTop: orderData?.status_timestamps?.delivered_at ? 6 : 0 }]}>
                                    <View style={styles.statusRow}>
                                        <SvgUnselectedOrdersIcon />
                                        <CustomText style={styles.statusTitle}>Order Picked Up</CustomText>
                                    </View>
                                    <CustomText style={styles.statusTime}>{formatOrderDate(orderData?.status_timestamps?.picked_up_at)}</CustomText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Vendor Info */}
                    <View style={styles.card}>
                        <View style={styles.vendorHeader}>
                            <View style={styles.vendorInfo}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>

                                    <CustomText style={styles.vendorName}>{orderData?.vendor?.shop_name}</CustomText>


                                    {/* rating given check */}

                                    {orderData?.rating_given && (
                                        <View style={styles.ratingContainer}>
                                            <SvgStarIcon />
                                            <CustomText style={styles.ratingText}>{orderData?.user_rating}</CustomText>
                                        </View>
                                    )}


                                </View>
                                <View style={styles.locationRow}>
                                    <SvgLocationLine />
                                    <CustomText style={styles.vendorLocation}>{orderData?.vendor_address.address_line1}</CustomText>
                                </View>
                            </View>

                        </View>

                        <View style={styles.divider} />
                        <CustomText style={styles.orderId}>Order ID: #{orderData?.order_number}</CustomText>

                        <TouchableOpacity
                            style={styles.itemRow}
                            onPress={() => setIsVisible(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.qtyBox}>
                                <CustomText style={styles.qtyText}>
                                    {totalItemsCount}{hasWeightCategory ? 'kg' : 'X'}
                                </CustomText>
                            </View>
                            <CustomText style={styles.itemText}>
                                {serviceTypes.length > 0 ? serviceTypes.join(', ') : 'Items'}
                            </CustomText>
                            <CustomText style={styles.rupee}>₹{orderData?.payment_details?.item_total || 0}</CustomText>
                        </TouchableOpacity>


                    </View>

                    {/* Bill Summary */}
                    {orderData?.status !== "cancelled" && <BillSummaryCard
                        subtitle="Incl. All taxes & Charges"
                        billItems={[
                            { label: (hasWeightCategory ? `Item Total (${totalItemsCount}kg x ₹${wightPrice}/kg)` : 'Item Total'), amount: orderData?.payment_details?.item_total || 0 },
                            { label: 'Delivery Fee', amount: orderData?.payment_details?.delivery_fee || 0 },
                            { label: 'Platform Fee', amount: orderData?.payment_details?.amount_to_platform || 0 },
                            { label: 'GST', amount: orderData?.payment_details?.gst || 0 },
                        ]}
                        grandTotal={orderData?.payment_details?.grand_total || 0}
                        offer={orderData?.payment_details?.offerDiscountAmount || 0}
                        cashRoundOff={0.999999}
                        toPay={orderData?.payment_details?.totalPayableAmount || 0}
                    />}

                    {/* Other Details */}
                    <View style={styles.card}>
                        <CustomText style={styles.sectionTitle}>Other Details</CustomText>

                        {/* {orderData?.status === "cancelled" ? null : (
                            <>

                                <View style={styles.detailRow}>
                                    <SvgPaymentIcon />
                                    <CustomText style={styles.detailLabel}>Payment Method</CustomText>
                                </View>
                                <CustomText style={styles.detailValue}>Paid via: UPI</CustomText>
                            </>
                        )} */}

                        <View style={[styles.detailRow, { marginTop: 10 }]}>
                            <SvgLocation20Icon />
                            <CustomText style={styles.detailLabel}>Address</CustomText>
                        </View>
                        <CustomText style={styles.detailValue}>
                            {orderData?.user_address.address_line1},
                            {orderData?.user_address.address_line2},
                        </CustomText>
                    </View>

                    {/* Button delivered check  this status for completed orers */}

                    <View style={styles.buttonsContainer}>
                        {!orderData?.rating_given && orderData?.status === 'delivered' && (
                            <TouchableOpacity
                                style={styles.rateBtn}
                                onPress={() => {
                                    setIsRatingVisible(true)
                                }}
                                activeOpacity={0.7}
                            >
                                <CustomText style={styles.rateBtnText}>Rate This Order</CustomText>
                            </TouchableOpacity>
                        )}

                        {/* <TouchableOpacity
                            style={styles.invoiceBtn}
                            onPress={async () => {
                                if (!orderData?.invoice_url) {
                                    showErrorToast('Invoice downloading is not available for this order');
                                    return;
                                }
                                //   const url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                                await downloadInvoice(orderData?.invoice_url);
                            }}
                            activeOpacity={0.7}
                        >
                            <InvoiceDownloadIcon width={20} height={20} />
                            <CustomText style={styles.invoiceBtnText}>Invoice</CustomText>
                        </TouchableOpacity> */}
                    </View>


                </ScrollView>

                {/* Items Detail Bottom Sheet */}
                <ItemsDetailBottomsheet
                    isVisible={isVisible}
                    onClose={() => setIsVisible(false)}
                    title="Item Details"
                    items={orderItems}
                />

                {/* Rating Bottom Sheet */}
                <RatingBottomSheet
                    isVisible={isRatingVisible}
                    onClose={() => setIsRatingVisible(false)}
                    vendorName={orderData?.vendor?.shop_name || ""}
                    serviceName={firstServiceName}
                    orderId={orderId}
                    onSubmit={handleRatingSubmit}
                />
            </View>
        </SafeAreaView>
    );
};

export default CompletedOrderDetailsScreen;


