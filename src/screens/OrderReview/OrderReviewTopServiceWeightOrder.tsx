import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Rect } from "react-native-svg";
import CustomText from "../../components/Text";
import { COLORS, FONTFAMILY } from "../../constants";
import SvgEditGreenIcon from "../../assets/auto-generated-svg-icons/EditGreenIcon";
import { PreviewVendor } from "../../types/order/order";
type LoadSizeOption = "small" | "medium" | "large";

interface OrderReviewTopServiceWeightOrderProps {
  serviceName: string;
  selectedSize: LoadSizeOption;
  price: string;
  express: boolean;
  onExpressChange: (value: boolean) => void;
  onEdit: () => void;
  vendorDetails?: PreviewVendor;
  onLoadSizeChange: (size: LoadSizeOption) => void;
}

const OrderReviewTopServiceWeightOrder: React.FC<OrderReviewTopServiceWeightOrderProps> = ({
  serviceName,
  selectedSize,
  price,
  onEdit,
  express,
  vendorDetails
}) => {






  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <CustomText style={styles.title}>{serviceName?.trim() || ''}</CustomText>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <SvgEditGreenIcon />
          <CustomText style={styles.editText}>Edit</CustomText>
        </TouchableOpacity>
      </View>

      {/* Express Box */}
      {/* Express Service Toggle */}
      {express && (
        <View style={styles.expressRow}>
          <CustomText style={styles.expressText}>
            {`Express Service in ${vendorDetails?.express_delivery_time.trim()}`}
          </CustomText>
        </View>
      )}

      {/* Pricing Box */}
      <View style={styles.priceBox}>
        <CustomText style={styles.sizeText}>
          {vendorDetails?.items[0]?.item_name}
        </CustomText>
        <CustomText style={styles.priceText}>
          ₹{express
            ? (vendorDetails?.items[0]?.express_price_per_item || vendorDetails?.items[0]?.price_per_item || 0)
            : (vendorDetails?.items[0]?.normal_price_per_item || vendorDetails?.items[0]?.price_per_item || 0)
          }
        </CustomText>
      </View>

      {/* Note */}
      <CustomText style={styles.noteText}>
        Note: Clothes will be weighed during pickup and the bill will be generated accordingly.
      </CustomText>
    </View>
  );
};

export default OrderReviewTopServiceWeightOrder;

const styles = StyleSheet.create({

  card: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BACKGROUND,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editText: {
    fontSize: 16,
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
  },
  expressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.EXPRESS_BORDER,
    backgroundColor: COLORS.Express_background,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 24,
  },
  expressText: {
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontSize: 16,
    fontWeight: "400",
    textAlign: 'center',
    flex: 1
  },
  priceBox: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  sizeText: {
    fontSize: 16,
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    marginBottom: 4,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_MEDIUM, fontWeight: '500',
  },
  noteText: {
    fontSize: 14,
    color: COLORS.NOTE_TEXT,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: '400',
  },
});
