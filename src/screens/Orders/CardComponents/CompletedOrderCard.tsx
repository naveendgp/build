import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import CustomText from '../../../components/Text';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import SvgLocationLine from '../../../assets/auto-generated-svg-icons/LocationLine';
import { Text } from 'react-native-gesture-handler';

export interface CompletedOrderCardProps {
  orderId: string;
  location: string;
  orderType: 'standard' | 'express';
  serviceQuantity?: string;
  serviceWeight?: string;
  serviceType: string;
  isWeightBased: boolean;
  timeline: Array<{
    status: string;
    date: string;
    time: string;
    isCompleted?: boolean;
  }>;
  totalPrice: string;
  onViewDetails?: () => void;
}

const CompletedOrderCard: React.FC<CompletedOrderCardProps> = ({
  orderId,
  location,
  orderType,
  serviceQuantity,
  serviceWeight,
  serviceType,
  timeline,
  totalPrice,
  isWeightBased,
  onViewDetails,
}) => {
  const isExpress = orderType === 'express';


  console.log(serviceWeight, serviceQuantity);

  const displayOrderId = useMemo(() => {
    if (!orderId) {
      return '';
    }
    const orderIdStr = orderId.toString();
    return orderIdStr.length <= 5 ? orderIdStr : "......" + orderIdStr.slice(-7);
  }, [orderId]);

  return (
    <View style={[styles.card, isExpress && styles.cardExpress]}>
      {/* Order Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CustomText style={styles.orderId}>#{displayOrderId}</CustomText>
          <View style={styles.locationContainer}>
            <SvgLocationLine />
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.location}>{location}</Text>
          </View>
        </View>

        <CustomText style={styles.orderTypeText}>
          {isExpress ? 'Express' : 'Standard'}
        </CustomText>
      </View>

      {/* Separator */}
      <View style={styles.timelineLine} />

      {/* Item Details */}
      <View style={styles.itemRow}>
        <View style={styles.quantityBox}>
          <CustomText style={styles.quantityText}>
            {serviceQuantity?.replace(' X', '')} {isWeightBased ? 'kg' : 'X'}
          </CustomText>
        </View>
        <CustomText style={styles.serviceTypeText}>{serviceType}</CustomText>
      </View>

      <View style={styles.timelineLine} />
      {/* Order Timeline */}
      <View style={styles.timelineContainer}>
        {timeline.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineContent}>
              <CustomText style={styles.timelineText}>
                {item.status} - {item.date}, {item.time}
              </CustomText>
              {index === 0 && (
                <CustomText style={styles.priceText}>
                  ₹ {parseFloat(totalPrice || '0').toFixed(2)}
                </CustomText>
              )}
            </View>

          </View>
        ))}

        {/* Current Status Indicator */}
        {timeline.length > 0 && !timeline[timeline.length - 1].isCompleted && (
          <View style={styles.currentStatusContainer}>
            <View style={styles.statusDot} />
            <CustomText style={styles.currentStatusText}>
              Order yet reach customer
            </CustomText>
          </View>
        )}
      </View>

      {/* View Details Button */}
      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={onViewDetails}
        activeOpacity={0.7}
      >
        <CustomText style={styles.viewDetailsText}>View details</CustomText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    marginBottom: 16,
  },
  cardExpress: {
    backgroundColor: COLORS.EXPRESS_BACKGROUND,
    borderColor: COLORS.EXPRESS_BORDER,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18 * (120 / 100),
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
    maxWidth: '80%'
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  dashedSeparator: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: COLORS.TEXT_MUTED,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8
  },
  quantityBox: {
    backgroundColor: COLORS.BORDER_INPUT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  serviceTypeText: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  timelineContainer: {
    marginBottom: 16,
    marginTop: 8
  },
  timelineItem: {
    marginBottom: 8,
  },
  timelineContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    flex: 1,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    marginLeft: 8,
  },
  timelineLine: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.SEPARATOR,
    marginBottom: 8,
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF', // Blue dot as per design
    marginRight: 8,
  },
  currentStatusText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.THEME_GREEN,
    borderRadius: 12,
    height: 45,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  viewDetailsText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
});

export default CompletedOrderCard;

