import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import CustomSwitch from "../../components/CustomSwitch";
import LaundryItemCard from "../../components/LaundryItemCard";
import CustomText from "../../components/Text";
import { COLORS, FONTFAMILY } from "../../constants";
import { PreviewVendor } from "../../types/order/order";

export interface OrderItem {
	id: string;
	name: string;
	price: number;
	express_price: number;
	quantity: number;
	category: string;
	service_id: string;
	service_name: string;
}

interface OrderReviewTopServiceItemOrderProps {
	serviceName: string;
	items: OrderItem[];
	express: boolean;
	onExpressChange: (value: boolean) => void;
	onAddMore: () => void;
	onItemQuantityChange: (itemId: string, quantity: number) => void;
	vendorDetails?: PreviewVendor;
}

const OrderReviewTopServiceItemOrder: React.FC<OrderReviewTopServiceItemOrderProps> = ({
	serviceName,
	items,
	express,
	onExpressChange,
	vendorDetails,
	onAddMore,
	onItemQuantityChange,
}) => {
	const categories = Array.from(new Set(items.map((item) => item.category)));
	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<CustomText style={styles.serviceTitle}>{serviceName}</CustomText>
				<TouchableOpacity onPress={onAddMore} style={styles.addMoreBtn}>
					<CustomText style={styles.addMoreText}>+ Add More</CustomText>
				</TouchableOpacity>
			</View>
			{/* Express Service Toggle */}
			{express && (
				<View style={styles.expressRow}>
					<CustomText style={styles.expressText}>
						{`Express Service in ${vendorDetails?.express_delivery_time || ''}`}
					</CustomText>
				</View>
			)}


			{/* Items List by Category */}
			<ScrollView
				showsVerticalScrollIndicator={false}
				style={styles.itemsList}
				contentContainerStyle={styles.itemsListContent}
				nestedScrollEnabled={true}
				key={`items-list-${express}`}
			>
				{categories.length > 0 ? (
					categories.map((category) => {
						const categoryItems = items.filter((item) => item.category === category);
						if (categoryItems.length === 0) return null;

						return (
							<View key={`${category}-${express}`} style={styles.categorySection}>
								<CustomText style={styles.categoryTitle}>{category}</CustomText>
								{categoryItems.map((item) => (
									<LaundryItemCard
										key={`${item.id}-${express}`}
										item={{
											item_id: item.id,
											item_name: item.name,
											item_price: item.price,
											express_price: item.express_price,
										}}
										quantity={item.quantity}
										onIncrement={() => onItemQuantityChange(item.id, item.quantity + 1)}
										onDecrement={() => onItemQuantityChange(item.id, Math.max(0, item.quantity - 1))}
										minQuantity={0}
										express={express}
									/>
								))}
							</View>
						);
					})
				) : (
					<View style={styles.emptyContainer}>
						<CustomText style={styles.emptyText}>No items selected</CustomText>
					</View>
				)}
			</ScrollView>
		</View>
	);
};

export default OrderReviewTopServiceItemOrder;

const styles = StyleSheet.create({
	container: {
		borderWidth: 1,
		borderColor: COLORS.CARD_BACKGROUND,
		backgroundColor: COLORS.BUTTON_BACKGROUND,
		borderRadius: 16,
		padding: 16,
		paddingBottom: -8
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	serviceTitle: {
		fontSize: 24,
		fontWeight: "600",
		color: COLORS.TEXT_PRIMARY,
		fontFamily: FONTFAMILY.INTER_SEMIBOLD,
	},
	addMoreBtn: {
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	addMoreText: {
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
	itemsList: {
		flexGrow: 1,

	},
	itemsListContent: {
		paddingBottom: 8,
	},
	categorySection: {

	},
	emptyContainer: {
		paddingVertical: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyText: {
		fontSize: 14,
		color: COLORS.LOGIN_SUBTITLE,
		fontFamily: FONTFAMILY.INTER_REGULAR,
	},
	categoryTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: COLORS.BOTTOM_BLACK,
		fontFamily: FONTFAMILY.INTER_MEDIUM,
		marginBottom: 16,
	},
});

