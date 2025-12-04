import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import CustomText from '../../../components/Text';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import DraggableSlider, { BasicDraggableSliderHandle } from '../../../components/DraggableSlider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TimeLineCard from './TimeLineCard';
import SvgRiderAcceptedIcon from '../../../assets/auto-generated-svg-icons/RiderAcceptedIcon';
import { OrderStatus } from '../../../types/order/order';
import SvgLocationLine from '../../../assets/auto-generated-svg-icons/LocationLine';
import SvgForwardRightBlackSvg from '../../../assets/auto-generated-svg-icons/ForwardRightBlackSvg';
import SvgChevronRight from '../../../assets/auto-generated-svg-icons/ChevronRight';
import SvgBillIcon from '../../../assets/auto-generated-svg-icons/BillIcon';
import SvgChevronRightBlack from '../../../assets/auto-generated-svg-icons/ArrowRightIcon';
import { acceptOrder, completeOrder, fetchOrderById } from '../../../apiService/api/ordersApi';
import { showSuccessToast, showErrorToast } from '../../../utils/Toast';
import { useQuery } from '@tanstack/react-query';
import ItemsDetailBottomsheet, { OrderItem } from '../BottomSheets/ItemsDetailBottomsheet';
import BillSummaryBottomsheet, { BillSummaryData } from '../BottomSheets/BillSummaryBottomsheet';
import { VendorOrder, OrderUpdateLog } from '../../../apiService/types/ordersTypes';
import { useOrderTimeline } from '../hooks/useOrderTimeline';
import CountdownTimer from '../../../components/CountdownTimer';

export interface ReceivedOrderCardProps {
  orderId: string;
  tabType?: OrderStatus;
  location: string;
  orderType: 'standard' | 'express';
  customerName: string;
  orderNumber?: number;
  time: string;
  expiredTime: string;
  serviceQuantity?: string;
  serviceWeight?: string;
  serviceType: string;
  customerNote: string;
  totalBill?: string;
  timer?: string;
  onAccept?: () => void;
  onViewDetails?: () => void;
  onViewBill?: () => void;
  onExpire?: () => void;
  index?: number;
  trip_type?: number;
  status_type?: number;
  updateLogs?: OrderUpdateLog[];
  vendorOrderData?: VendorOrder;
}

const ReceivedOrderCard: React.FC<ReceivedOrderCardProps> = ({
  orderId,
  location,
  orderType,
  customerName,
  orderNumber,
  time,
  expiredTime,
  serviceQuantity,
  serviceWeight,
  serviceType,
  customerNote,
  totalBill,
  timer = '00:04:59',
  onAccept,
  onViewDetails,
  onViewBill,
  onExpire,
  tabType,
  trip_type,
  status_type,
  index,
  updateLogs,
  vendorOrderData,
}) => {
  const isExpress = orderType === 'express';
  const CONTAINER_WIDTH = 235;
  const CONTAINER_HEIGHT = 48;

  const sliderRef = useRef<BasicDraggableSliderHandle>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isBillBottomSheetVisible, setIsBillBottomSheetVisible] = useState(false);
  const [shouldFetchOrder, setShouldFetchOrder] = useState(false);
  const pendingBottomSheetRef = useRef<'items' | 'bill' | null>(null);
  const isOpeningRef = useRef(false);

  const timelineEvents = useOrderTimeline(vendorOrderData);

  // Log updateLogs data
  // useEffect(() => {
  //   console.log('📋 ReceivedOrderCard - updateLogs:', updateLogs);
  //   console.log('📋 ReceivedOrderCard - orderId:', orderId);
  //   if (updateLogs && updateLogs.length > 0) {
  //     console.log('📋 ReceivedOrderCard - updateLogs count:', updateLogs.length);
  //     updateLogs.forEach((log, index) => {
  //       console.log(`📋 ReceivedOrderCard - updateLog[${index}]:`, {
  //         status: log.status,
  //         statusStr: log.statusStr,
  //         timestamp: log.timestamp,
  //       });
  //     });
  //   }
  // }, [updateLogs, orderId]);

  // Fetch order details when bottom sheet should be opened
  // Keep query enabled to access cached data, but only fetch when needed for items
  const {
    data: orderResponse,
    isLoading: isLoadingOrder,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ['orderDetails', orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: shouldFetchOrder && !!orderId, // Only enabled when explicitly needed
    staleTime: 30000, // Cache for 30 seconds to prevent unnecessary refetches
    refetchOnMount: false, // Don't refetch if data exists in cache
    refetchOnWindowFocus: false,
  });

  // Get the first order from the response
  const vendorOrder: VendorOrder | undefined = useMemo(
    () => orderResponse?.data?.orders?.[0],
    [orderResponse?.data?.orders]
  );

  // Open the appropriate bottom sheet when data is loaded
  useEffect(() => {
    if (shouldFetchOrder && vendorOrder && !isLoadingOrder && pendingBottomSheetRef.current && !isOpeningRef.current) {
      isOpeningRef.current = true;
      const pendingType = pendingBottomSheetRef.current;

      // Use setTimeout to ensure state updates happen in the next tick
      setTimeout(() => {
        if (pendingType === 'items') {
          setIsBottomSheetVisible(true);
        } else if (pendingType === 'bill') {
          setIsBillBottomSheetVisible(true);
        }
        pendingBottomSheetRef.current = null;
        isOpeningRef.current = false;
      }, 0);
    }
  }, [vendorOrder, shouldFetchOrder, isLoadingOrder]);

  // Cleanup refs when orderId changes or component unmounts
  useEffect(() => {
    return () => {
      pendingBottomSheetRef.current = null;
      isOpeningRef.current = false;
    };
  }, [orderId]);

  // Get the appropriate text based on tab type
  const getSliderText = () => {
    if (tabType === OrderStatus.RECEIVED) {
      return 'Accept order';
    } else if (tabType === OrderStatus.ACCEPTED) {
      return 'Ready to pick up';
    }
    return 'Accept order'; // Default fallback
  };

  const handleComplete = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      if (tabType === OrderStatus.RECEIVED) {
        // Handle accept order
        const response = await acceptOrder({
          orderId,
          isReject: false,
        });

        if (response.status) {
          showSuccessToast(response.message || 'Order accepted successfully');
          onAccept?.();
        } else {
          showErrorToast(response.message || 'Failed to accept order');
        }
      } else if (tabType === OrderStatus.ACCEPTED) {
        // Handle complete order
        const response = await completeOrder(orderId);

        if (response.status) {
          showSuccessToast(response.message || 'Order marked as complete successfully');
          onAccept?.();
        } else {
          showErrorToast(response.message || 'Failed to complete order');
        }
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        (tabType === OrderStatus.RECEIVED
          ? 'Failed to accept order. Please try again.'
          : 'Failed to complete order. Please try again.');
      showErrorToast(errorMessage);
    } finally {
      setIsProcessing(false);
      sliderRef.current?.reset();
    }
  };

  const handleArrowPress = useCallback(() => {
    // Prevent multiple rapid clicks
    if (isOpeningRef.current || isBottomSheetVisible) return;

    // If data is already available, open immediately
    if (vendorOrder && !isLoadingOrder) {
      setIsBottomSheetVisible(true);
    } else {
      // Otherwise, fetch the data first
      pendingBottomSheetRef.current = 'items';
      setShouldFetchOrder(true);
    }
  }, [vendorOrder, isLoadingOrder, isBottomSheetVisible]);

  const handleCloseBottomSheet = useCallback(() => {
    setIsBottomSheetVisible(false);
    // Don't reset shouldFetchOrder immediately to keep data cached
    pendingBottomSheetRef.current = null;
    isOpeningRef.current = false;
  }, []);

  const handleBillPress = useCallback(() => {
    // Prevent multiple rapid clicks
    if (isOpeningRef.current || isBillBottomSheetVisible) return;

    // Open bottom sheet immediately, show loader if data is not ready
    setIsBillBottomSheetVisible(true);

    // If data is not available, fetch it
    if (!vendorOrder && !isLoadingOrder) {
      pendingBottomSheetRef.current = 'bill';
      setShouldFetchOrder(true);
    }
  }, [vendorOrder, isLoadingOrder, isBillBottomSheetVisible]);

  const handleCloseBillBottomSheet = useCallback(() => {
    setIsBillBottomSheetVisible(false);
    // Don't reset shouldFetchOrder immediately to keep data cached
    pendingBottomSheetRef.current = null;
    isOpeningRef.current = false;
  }, []);

  // Prepare items data for bottom sheet - memoized to prevent recalculation
  const itemsData = useMemo((): OrderItem[] => {
    if (!vendorOrder?.items) return [];

    return vendorOrder.items.map((item, index) => ({
      id: item.item_id || index.toString(),
      type: item.service_name.toLowerCase().includes('iron') ? 'iron' : 'wash',
      itemName: item.item_name,
      category: item.service_name,
      quantity: item.quantity,
      amount: item.price_per_item,
    }));
  }, [vendorOrder?.items]);

  // Prepare bill summary data for bottom sheet - memoized to prevent recalculation
  const billSummaryData = useMemo((): BillSummaryData | null => {
    if (!vendorOrder) return null;

    // Calculate item total from items
    const itemTotal = vendorOrder.items?.reduce((sum, item) => sum + item.total_price, 0) || 0;

    // Get GST from payment_details
    const gst = vendorOrder.payment_details?.gst || 0;
    const gstPercentage = itemTotal > 0 ? ((gst / itemTotal) * 100).toFixed(0) : '18';

    // Get grand total
    const grandTotal = vendorOrder.total_amount || vendorOrder.payment_details?.totalPayableAmount || 0;

    return {
      itemTotal: itemTotal.toFixed(2),
      gst: gst.toFixed(2),
      gstPercentage,
      grandTotal: grandTotal.toFixed(2),
    };
  }, [vendorOrder]);

  // Memoize the items bottom sheet title
  const itemsBottomSheetTitle = useMemo(() => `${serviceType} Item Details`, [serviceType]);

  const displayOrderId = useMemo(() => {
    if (!orderId) {
      return '';
    }
    const orderIdStr = orderId.toString();
    return orderIdStr.length <= 5 ? orderIdStr : "......" + orderIdStr.slice(-5);
  }, [orderId]);


  console.log(tabType, trip_type, status_type);
  console.log(tabType === OrderStatus.RECEIVED ||
    (tabType === OrderStatus.ACCEPTED && trip_type === 1 && status_type === 10));

  return (
    <View style={{ marginBottom: 16 }} >
      <View
        style={{
          backgroundColor: COLORS.BUTTON_BACKGROUND,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.BORDER_INPUT,
          marginBottom: 8,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'flex-start',
        }}
      >
        <CustomText
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: COLORS.INPUT_TEXT,
            paddingHorizontal: 11,
            paddingVertical: 10,
            lineHeight: 16 * (120 / 100),
            fontFamily: FONTFAMILY.INTER_REGULAR,
          }}
        >
          #{index !== undefined ? index + 1 : orderId}
        </CustomText>
      </View>

      <View style={[styles.card, isExpress && styles.cardExpress]}>
        {/* Order Header */}
        <View style={styles.header}>
          <View>
            <CustomText style={styles.orderId}>#{displayOrderId}</CustomText>
            <View style={styles.locationContainer}>

              <SvgLocationLine />
              <CustomText style={styles.location} numberOfLines={1} ellipsizeMode="tail">{location}</CustomText>
            </View>
          </View>

          <CustomText style={styles.orderTypeText}>
            {isExpress ? 'Express' : 'Standard'}
          </CustomText>
        </View>

        <View
          style={{
            width: '100%',
            borderTopWidth: 1,
            borderTopColor: COLORS.TEXT_MUTED,
            borderStyle: 'dashed',
            marginVertical: 12,
          }}
        />


        {/* Customer Row */}
        <View style={styles.customerRow}>
          <CustomText style={styles.customerName}>
            {isExpress && orderNumber
              ? `${customerName}'s ${orderNumber}${getOrdinalSuffix(
                orderNumber,
              )} Order`
              : customerName}
          </CustomText>
          <CustomText style={styles.time}>{time}</CustomText>
        </View>

        <View
          style={{
            width: '100%',
            height: 1,
            backgroundColor: COLORS.SEPARATOR,
            marginVertical: 16,
          }}
        ></View>

        {/* Tag Row */}
        <View style={styles.tagRow}>
          <View style={styles.pillTag}>
            <CustomText style={styles.pillText}>
              {isExpress ? serviceWeight : serviceQuantity}
            </CustomText>
          </View>

          <TouchableOpacity
            onPress={handleArrowPress}
            style={styles.servicePill}
            activeOpacity={0.7}
          >
            <CustomText style={styles.serviceTypeText}>
              {serviceType}
            </CustomText>
            <SvgChevronRight width={16} height={16} />

          </TouchableOpacity>
        </View>

        <View
          style={{
            width: '100%',
            borderTopWidth: 1,
            borderTopColor: COLORS.SEPARATOR,
            borderStyle: 'dashed',
            marginVertical: 12,
          }}
        />


        {/* Note */}
        <View>
          <CustomText style={styles.noteTitle}>Note from customer</CustomText>
          <CustomText style={styles.noteText}>{customerNote}</CustomText>
        </View>

        <View
          style={{
            width: '100%',
            height: 1,
            backgroundColor: COLORS.SEPARATOR,
            marginVertical: 16,
          }}
        />

        {/* Bill Container */}
        <TouchableOpacity
          style={styles.billBox}
          onPress={handleBillPress}
          activeOpacity={0.7}
        >
          <View style={styles.billCenter}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <SvgBillIcon />

              <View>
                <CustomText style={styles.billMain}>
                  Total Bill {totalBill ? `₹${totalBill}` : '-'}
                </CustomText>
                <CustomText style={styles.billSub}>
                  Incl. All taxes & Charges
                </CustomText>
              </View>
            </View>


          </View>
          <SvgChevronRightBlack />
        </TouchableOpacity>

        {/* Buttons */}


        {(
          tabType === OrderStatus.RECEIVED ||
          (tabType === OrderStatus.ACCEPTED && vendorOrderData?.trip_type === 1 && vendorOrderData?.status_type === 10)
        ) && (
            <View style={styles.actionRow}>
              <View style={styles.sliderContainer}>
                <GestureHandlerRootView>
                  <DraggableSlider
                    ref={sliderRef}
                    onComplete={handleComplete}
                    text={getSliderText()}
                    isReadyForPickUp={tabType === OrderStatus.ACCEPTED && vendorOrderData?.trip_type === 1 && vendorOrderData?.status_type === 10}
                  />
                </GestureHandlerRootView>
              </View>

              {vendorOrderData?.created_at && vendorOrderData?.expiry_at ? (
                <CountdownTimer
                  createdAt={vendorOrderData.created_at}
                  expiredTime={vendorOrderData.expiry_at}
                  onExpire={onExpire}
                />
              ) : null}
            </View>
          )}



        {(tabType !== OrderStatus.RECEIVED) && timelineEvents && timelineEvents.length > 0 && !(vendorOrderData?.trip_type === 1 && vendorOrderData?.status_type === 10) && (
          timelineEvents.map((event, index) => (
            <TimeLineCard
              key={event.id}
              date={event.date}
              time={event.time}
              title={event.title}
              icon={event.icon}
              iconType={event.iconType}
              note={index === 0 ? 'Note: order cannot be canceled after accepted by the shop' : ''}
              showCallButton={event.showCallButton}
              onCallPress={() => { }}
              otp={event.showOtp ? event.otp : undefined}
              showTimelineLine={index < timelineEvents.length - 1}
              riderName={event.riderName}
              riderPhone={event.riderPhone}
            />
          ))


        )}


      </View>

      {/* Items Detail Bottom Sheet */}
      <ItemsDetailBottomsheet
        isVisible={isBottomSheetVisible}
        onClose={handleCloseBottomSheet}
        title={itemsBottomSheetTitle}
        items={itemsData}
      />

      {/* Bill Summary Bottom Sheet */}
      <BillSummaryBottomsheet
        isVisible={isBillBottomSheetVisible}
        onClose={handleCloseBillBottomSheet}
        billData={billSummaryData}
        isLoading={isBillBottomSheetVisible && (isLoadingOrder || !billSummaryData)}
      />
    </View>
  );
};

const getOrdinalSuffix = (n: number) => {
  const j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

const styles = StyleSheet.create({


  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  cardExpress: {
    backgroundColor: COLORS.EXPRESS_BACKGROUND, // yellow from screenshot
    borderColor: COLORS.EXPRESS_BORDER,
    borderWidth: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18 * (120 / 100),
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },

  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  location: {
    marginLeft: 4,
    fontSize: 12,
    width: (Dimensions.get('window').width) - 180,
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    lineHeight: 12 * (130 / 100),
    fontWeight: '400',

  },

  orderTypeText: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18 * (120 / 100),
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },

  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 14 * (120 / 100),
    fontFamily: FONTFAMILY.INTER_REGULAR,
    flex: 1,
  },
  time: {
    fontWeight: '400',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    lineHeight: 14 * (120 / 100),
    fontSize: 14,
  },

  tagRow: { flexDirection: 'row', alignItems: 'center' },

  pillTag: {
    backgroundColor: COLORS.BORDER_INPUT,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    gap: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },

  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  serviceTypeText: {
    color: COLORS.THEME_GREEN,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },

  noteSection: { marginBottom: 12 },
  noteTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.INPUT_TEXT,
    marginBottom: 8,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.NOTE_TEXT,
    lineHeight: 14 * (142 / 100),
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },

  billBox: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  billCenter: { flex: 1, marginLeft: 12 },
  billMain: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  billSub: {
    fontSize: 16,
    color: COLORS.NOTE_TEXT,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  sliderContainer: {
    flex: 1,
    minWidth: 0, // Allow flex to shrink if needed
  },

  arrowBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.THEME_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },

  acceptBtn: {
    flex: 1,
    backgroundColor: COLORS.THEME_GREEN,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  timerBtn: {
    backgroundColor: '#1B2A4A',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: COLORS.WHITE, fontSize: 16,
    fontWeight: '500', fontFamily: FONTFAMILY.INTER_MEDIUM
  },

});

export default ReceivedOrderCard;
