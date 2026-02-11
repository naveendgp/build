import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { FONTFAMILY, COLORS } from "../../../constants";
import CustomText from "../../../components/Text";
import { Order } from "../../../types/order/order";
import { useOrderCardTimeline } from "./hooks/useOrderCardTimeline";

import SvgStartIcon from "../../../assets/auto-generated-svg-icons/StarIcon";
import SvgLocationIcon from "../../../assets/auto-generated-svg-icons/LocationIcon";
import SvgLocationLine from "../../../assets/auto-generated-svg-icons/LocationLine";

// Status message mapping - can be extended with more statuses
const getStatusMessage = (status: string | undefined, tripType?: number): string => {
  if (!status) return "";

  const normalizedStatus = status.toLowerCase().trim();

  const statusMap: Record<string, string> = {
    processed: "Order is being processed",
    processing: "Order is being processed",
    unaccepted: "Order was not accepted",
    cancelled: "Order has been cancelled",
    delivered: "Order has been delivered",
    picked_up: "Order has been picked up",
    pending: "Order not accepted yet",
    accepted: tripType === 2 ? "Order is ready for delivery" : "Order has been accepted by vendor",
    reached_to_user: "Driver has reached your location",
    verified: 'Driver has been verified by you',// rider otp,
    reached_to_vendor: tripType === 1 ? "Driver has reached the vendor" : 'Order is ready for delivery',
    out_for_delivery: "Order is out for delivery",
    delivery_otp_verified: "Order has been delivered",
    delivery_OTP_verified: "Order has been delivered",


    // Add more status mappings here as needed
  };

  // Check if we have a custom mapping
  if (statusMap[normalizedStatus]) {
    return statusMap[normalizedStatus];
  }

  // Fallback to original status if no mapping found
  return status;
};

interface LaundryCardProps {
  shopName: string;
  location: string;
  rating: number;
  item: string;
  quantity: number;
  delivered?: string;
  pickedUp: string;
  eta?: string;
  price: number;
  status?: string; // e.g. "Order received at the shop"
  isCompleted?: boolean;
  ratingGiven?: boolean;
  order?: Order; // Full order object for timeline building
  isWeightBased?: boolean;
  weight?: string;
}

const OrderCard: React.FC<LaundryCardProps> = ({
  shopName,
  location,
  rating,
  item,
  quantity,
  delivered,
  pickedUp,
  eta,
  price,
  status,
  isCompleted,
  ratingGiven,
  order,
  isWeightBased,
  weight
}) => {
  // Build timeline from order if available, otherwise use fallback props
  const timeline = useOrderCardTimeline(order);

  // Fallback to old props if order is not provided (for backward compatibility)
  const hasTimeline = timeline.length > 0;
  return (
    <View style={[styles.card, isCompleted && { backgroundColor: COLORS.CARD_BACKGROUND }]}>
      <View style={styles.header}>
        <View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.shopName}>{shopName}</Text>
            {isCompleted && ratingGiven && status?.toLowerCase() !== "cancelled" && (
              <View style={styles.ratingContainer}>
                <SvgStartIcon />
                <Text style={styles.rating}>{order?.user_rating}</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <SvgLocationLine />
            <Text style={styles.location}>{location}</Text>
          </View>
        </View>


      </View>

      <View style={styles.divider} />

      <View style={styles.itemRow}>
        <View style={styles.qtyBox}>
          <Text style={styles.qtyText}>{isWeightBased ? weight : quantity + ' X'}</Text>

        </View>
        <Text style={styles.itemName}>{item}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.detailsColumn}>
          {eta ? (
            <Text style={styles.detailText}>ETA - {eta}</Text>
          ) : (
            null
          )}
          {hasTimeline ? (
            <>
              {timeline.slice(-2).map((entry, index) => (
                <Text key={index} style={styles.detailText}>
                  {entry.status} - {entry.date}, {entry.time}
                </Text>
              ))}
              {timeline.length > 0 && !timeline[timeline.length - 1].isCompleted && (
                null
              )}
            </>
          ) : (
            null
          )}
        </View>
        <Text style={styles.price}>₹ {price.toFixed(2)}</Text>
      </View>

      {isCompleted ? (
        status?.toLowerCase() === "cancelled" ? (
          <View style={styles.cancelledBox}>
            <Text style={styles.cancelledText}>Order Cancelled</Text>
          </View>
        ) : status?.toLowerCase() === "unaccepted" || status?.toLowerCase() === "rejected" ? (
          null
        ) : !ratingGiven ? (
          <View style={styles.rateButton}>
            <Text style={styles.rateText}>Rate This Order</Text>
          </View>
        ) : null
      ) : (
        <View style={styles.statusBox}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{getStatusMessage(status, order?.trip_type)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 12,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  shopName: {
    fontFamily: FONTFAMILY.INTER_BOLD,
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "700",
    flex: 1,
    width: '75%',
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: COLORS.TEXT_GRAY,
    marginLeft: 4,
    marginRight: 10,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.2,
    justifyContent: 'flex-end',
    paddingRight: 12,
    width: '20%',
  },
  rating: {
    color: COLORS.ACCENT,
    marginLeft: 4,
    fontSize: 16,
    fontWeight: "400",
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.TEXT_MUTED,
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBox: {
    backgroundColor: COLORS.BORDER_INPUT,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 8,
    borderWidth: 0,
  },
  qtyText: {
    fontSize: 14,
    color: COLORS.BLACK,
    fontFamily: FONTFAMILY.INTER_MEDIUM, fontWeight: '500',
  },
  itemName: {
    fontSize: 14,
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_REGULAR, fontWeight: '400',
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailsColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.INPUT_TEXT,
    marginTop: 0,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    marginLeft: 8,
  },
  rateButton: {
    borderWidth: 1,
    borderColor: COLORS.ACCENT,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  rateText: {
    color: COLORS.ACCENT,
    fontWeight: "500",
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  statusBox: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 6,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2A78E4",
    marginRight: 8,
  },
  statusText: {
    color: COLORS.BOTTOM_BLACK,
    fontSize: 12,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
  },
  cancelledBox: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.RED,
  },
  cancelledText: {
    color: COLORS.RED,
    fontWeight: "500",
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  currentStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  currentStatusText: {
    color: COLORS.BOTTOM_BLACK,
    fontSize: 12,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default OrderCard;