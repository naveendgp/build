import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTFAMILY } from "../constants";
import CustomText from "./Text";

export interface LaundryItemCardProps {
	item: any;
	quantity: number;
	onIncrement: () => void;
	onDecrement: () => void;
	minQuantity?: number;
	disabled?: boolean;
	express?: boolean;
	removedAllItems?: () => void;
}

const QtyButton: React.FC<{ disabled?: boolean; onPress: () => void; sign: "+" | "-" }>
	= ({ disabled, onPress, sign }) => (
		<TouchableOpacity
			disabled={disabled}
			onPress={onPress}
			style={[styles.qtyBtn, disabled && styles.qtyBtnDisabled]}
			activeOpacity={0.7}
		>
			<CustomText style={[styles.qtyBtnText, disabled && styles.qtyBtnTextDisabled]}>
				{sign}
			</CustomText>
		</TouchableOpacity>
	);

const LaundryItemCard: React.FC<LaundryItemCardProps> = memo(({
	item,
	quantity,
	onIncrement,
	onDecrement,
	minQuantity = 0,
	disabled = false,
	express = false,
	removedAllItems
}) => {
	const minusDisabled = disabled || quantity <= 0;
	const price = express ? item?.express_price : item?.item_price;

	return (
		<View style={styles.itemCard}>
			<View style={{ flex: 1 }}>
				<CustomText style={styles.itemTitle}>{item?.item_name || ''}</CustomText>
				<CustomText style={styles.itemPrice}>{`₹${price || 0}`}</CustomText>
			</View>

			<View style={styles.qtyRow}>
				<QtyButton sign="-" disabled={minusDisabled} onPress={onDecrement} />
				<View style={styles.qtyBox}>
					<CustomText style={styles.qtyText}>{String(quantity).padStart(0, "0")}</CustomText>
				</View>
				<QtyButton sign="+" disabled={disabled} onPress={onIncrement} />
			</View>
		</View>
	);
});

export default LaundryItemCard;
LaundryItemCard.displayName = 'LaundryItemCard';

const styles = StyleSheet.create({
	itemCard: {
		backgroundColor: COLORS.CARD_BACKGROUND,
		borderRadius: 16,
		// borderWidth: 1,
		// borderColor: COLORS.BORDER_INPUT,
		padding: 12,
		marginBottom: 16,
		flexDirection: "row",
		alignItems: "center",
	},
	itemTitle: {
		color: COLORS.INPUT_TEXT,
		fontFamily: FONTFAMILY.INTER_REGULAR,
		fontWeight: "400",
		fontSize: 18,
		marginBottom: 4,
	},
	itemPrice: {
		color: COLORS.INPUT_TEXT,
		fontFamily: FONTFAMILY.INTER_MEDIUM,
		fontSize: 14,
		fontWeight: "500",
	},
	qtyRow: { flexDirection: "row", alignItems: "center" },
	qtyBtn: {
		width: 32,
		height: 32,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#04F604",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: COLORS.ICON_GREEN,
	},
	qtyBtnDisabled: {
		borderColor: "#86FF86",
		backgroundColor: "#E6F4EA",
		opacity: 0.7,
	},
	qtyBtnText: {
		fontFamily: FONTFAMILY.INTER_SEMIBOLD,
		fontSize: 16,
		color: "#026602",
	},
	qtyBtnTextDisabled: {
		color: "#74C38D",
	},
	qtyBox: {
		width: 40,
		height: 32,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginHorizontal: 2,
	},
	qtyText: { color: COLORS.INPUT_TEXT, fontFamily: FONTFAMILY.INTER_MEDIUM },
});
