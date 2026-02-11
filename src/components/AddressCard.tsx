import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import CustomText from "./Text";
import LocationIcon from "../assets/auto-generated-svg-icons/LocationIcon";
import { COLORS, FONTFAMILY } from "../constants";
import SvgLocationLine from "../assets/auto-generated-svg-icons/LocationLine";
import SvgLocationIcon from "../assets/auto-generated-svg-icons/LocationIcon";
import SvgLocationLineBlackIcon from "../assets/auto-generated-svg-icons/LocationLineBlackIcon";

type AddressCardProps = {
  label: string;
  formattedAddress: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  is_default?: boolean;
};

const AddressCard: React.FC<AddressCardProps> = ({ label, formattedAddress, onEdit, onDelete, isDeleting = false, is_default }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrapper}>
          {/* <LocationIcon width={24} height={24} /> */}
          <SvgLocationLineBlackIcon />
        </View>
        <CustomText style={styles.label}>{label}</CustomText>
      </View>

      <CustomText numberOfLines={2} style={styles.addressText}>
        {formattedAddress}
      </CustomText>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={onEdit} disabled={isDeleting}>
          <CustomText style={[styles.edit, isDeleting && styles.disabled]}>Edit</CustomText>
        </TouchableOpacity>
        {!is_default && <TouchableOpacity onPress={onDelete} disabled={isDeleting}>
          <CustomText style={[styles.delete, isDeleting && styles.disabled]}>
            {isDeleting ? "Deleting..." : "Delete"}
          </CustomText>
        </TouchableOpacity>}
      </View>
    </View>
  );
};

export default AddressCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  iconWrapper: { alignItems: "center", justifyContent: "center" },
  label: {
    marginLeft: 8,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.INPUT_TEXT,
    fontWeight: "500",
    fontSize: 16,
  },
  addressText: { fontSize: 13, color: COLORS.LOGIN_SUBTITLE, fontFamily: FONTFAMILY.INTER_REGULAR },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
  edit: { color: COLORS.THEME_GREEN, fontFamily: FONTFAMILY.INTER_MEDIUM },
  delete: { color: COLORS.RED, fontFamily: FONTFAMILY.INTER_MEDIUM },
  disabled: { opacity: 0.5 },
});


