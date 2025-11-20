import React, { useRef } from 'react';
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
import SvgChevronRightBlack from '../../../assets/auto-generated-svg-icons/ChevronRightBlack';

export interface ReceivedOrderCardProps {
  orderId: string;
  index?: number;
  tabType?: OrderStatus;
  location: string;
  orderType: 'standard' | 'express';
  customerName: string;
  orderNumber?: number;
  time: string;
  serviceQuantity?: string;
  serviceWeight?: string;
  serviceType: string;
  customerNote: string;
  totalBill?: string;
  timer?: string;
  onAccept?: () => void;
  onViewDetails?: () => void;
  onViewBill?: () => void;
  index?: number;
}

const ReceivedOrderCard: React.FC<ReceivedOrderCardProps> = ({
  orderId,
  index,
  location,
  orderType,
  customerName,
  orderNumber,
  time,
  serviceQuantity,
  serviceWeight,
  serviceType,
  customerNote,
  totalBill,
  timer = '00:04:59',
  onAccept,
  onViewDetails,
  onViewBill,
  tabType,
  index
}) => {
  const isExpress = orderType === 'express';
  const CONTAINER_WIDTH = 235;
  const CONTAINER_HEIGHT = 48;

  const sliderRef = useRef<BasicDraggableSliderHandle>(null);

  console.log('tabType', tabType);

  const handleComplete = () => {
    console.log('handleComplete');
    sliderRef.current?.reset();
  };

  return (
    <View >
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
            <CustomText style={styles.orderId}>#{index !== undefined ? index + 1 : orderId}</CustomText>
            <View style={styles.locationContainer}>

              <SvgLocationLine />
              <CustomText style={styles.location}>{location}</CustomText>
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
            onPress={onViewDetails}
            style={styles.servicePill}
            activeOpacity={0.7}
          >
            <CustomText style={styles.serviceTypeText}>
              {serviceType}
            </CustomText>
            <SvgChevronRight />

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
          onPress={onViewBill}
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

        {(tabType === OrderStatus.RECEIVED || tabType === OrderStatus.ACCEPTED) && (
          <View style={styles.actionRow}>

            <GestureHandlerRootView >
              <DraggableSlider ref={sliderRef} onComplete={handleComplete} text="Accept Order" />
            </GestureHandlerRootView>


            <View style={{
              backgroundColor: COLORS.LOGIN_SUBTITLE, height: 48,
              justifyContent: 'center', alignItems: 'center',
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 12,
            }}>
              <CustomText style={styles.timerText}>{timer}</CustomText>
            </View>
          </View>
        )}


        {(tabType !== OrderStatus.RECEIVED) && (
          <TimeLineCard
            key={'1'}
            date={'Today'}
            time={'12:00 PM'}
            title={' Order Accepted'}
            icon={SvgRiderAcceptedIcon}
            iconType={'svg'}
            note={'Note: order cannot be canceled after accepted by the shop'}
            showCallButton={true}
            onCallPress={() => { }}
            otp={''}
            showTimelineLine={true}
            riderName={'John Doe'}
            riderPhone={'+91 9876543210'}
          />
        )}


      </View>
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

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },

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
