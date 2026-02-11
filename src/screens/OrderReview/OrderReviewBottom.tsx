import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Discount from "../../assets/auto-generated-svg-icons/Discount";
import AddNoteIcon from "../../assets/auto-generated-svg-icons/AddNoteIcon";
import DetailCard from "../../components/DetailCard";
import CustomText from "../../components/Text";
import { COLORS, FONTFAMILY } from "../../constants";
import { PreviewVendor } from "../../types/order/order";
import SvgLocation20Icon from "../../assets/auto-generated-svg-icons/Location20Icon";
import SvgPhoneIconBlack from "../../assets/auto-generated-svg-icons/PhoneIconBlack";
import SvgTotalBillIcon from "../../assets/auto-generated-svg-icons/BillIcon";
import SvgExpressIcon20 from "../../assets/auto-generated-svg-icons/ExpressIcon20";
import SvgStandartIcon20 from "../../assets/auto-generated-svg-icons/StandardIcon20";
interface ContactInfo {
	name: string;
	number: string;
}

interface OrderReviewBottomProps {
	onAddNote: () => void;
	onOfferPress: () => void;
	onExpressPress: () => void;
	onDeliveryAddressPress: () => void;
	onContactPress: () => void;
	onTotalBillPress: () => void;
	totalBill: string;
	contactInfo: ContactInfo;
	deliveryAddressTitle?: string;
	deliveryAddressSubtitle?: string;
	note?: string;
	pricing?: {
		offer_percentage?: number;
		offer_max_cap?: number;
		is_offer_applied?: boolean;
	};
	vendorDetails?: PreviewVendor;
	isWeightBased?: boolean;
}

const OrderReviewBottom: React.FC<OrderReviewBottomProps> = ({
	onAddNote,
	onOfferPress,
	onExpressPress,
	onDeliveryAddressPress,
	onContactPress,
	onTotalBillPress,
	totalBill,
	contactInfo,
	deliveryAddressTitle = "",
	deliveryAddressSubtitle = "",
	note = "",
	pricing,
	vendorDetails,
	isWeightBased = false,
}) => {
	return (
		<View style={styles.container}>
			{/* Add Note Section */}
			<TouchableOpacity onPress={onAddNote} style={styles.addNoteBtn}>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
					<AddNoteIcon height={16} width={16} />

					<CustomText style={styles.addNoteText}>Add a Note for the shop</CustomText>
				</View>
				{note &&
					<CustomText style={styles.noteText}>{note}</CustomText>
				}
			</TouchableOpacity>

			{/* Offers Section */}
			{pricing?.is_offer_applied && (<TouchableOpacity onPress={onOfferPress} style={styles.offerCard}>
				<View style={styles.offerHeader}>
					<Discount />
					<CustomText style={styles.offerTitle}>Offers</CustomText>
				</View>
				<CustomText style={styles.offerText}>
					Flat {pricing?.offer_percentage} % off, up to ₹{pricing?.offer_max_cap}
				</CustomText>
			</TouchableOpacity>)}

			{/* Delivery Details Section */}
			<View style={{
				backgroundColor: COLORS.BUTTON_BACKGROUND,
				borderRadius: 16, padding: 16,
				borderWidth: 1,
				borderColor: COLORS.CARD_BACKGROUND
			}}>


				<CustomText style={styles.sectionTitle}>Delivery Details</CustomText>

				{/* Express Delivery Card */}
				<DetailCard
					showArrow={vendorDetails?.is_express_available}
					iconName={vendorDetails?.is_express ? <SvgExpressIcon20 /> : <SvgStandartIcon20 />}
					title={vendorDetails?.is_express ? "Express" : "Standard"}
					subtitle={
						vendorDetails?.is_express
							? `Express Service in ${vendorDetails?.express_delivery_time ?? ''}`
							: `Standard Service in ${vendorDetails?.standard_delivery_time ?? ''}`
					}
					onPress={vendorDetails?.is_express_available ? onExpressPress : undefined}
				/>

				{/* Delivery Address Card */}
				<DetailCard
					iconName={<SvgLocation20Icon />}
					title={deliveryAddressTitle}
					subtitle={deliveryAddressSubtitle}
					onPress={onDeliveryAddressPress}
				/>

				{/* Contact Card */}
				<DetailCard
					iconName={<SvgPhoneIconBlack />}
					title={contactInfo.name}
					subtitle={`+91 ${contactInfo.number}`}
					onPress={onContactPress}
				/>

				{/* Total Bill Card */}
				{isWeightBased ?
					<DetailCard
						iconName={<SvgTotalBillIcon />}
						title={`Total Bill ${totalBill}`}
						subtitle="Incl. All taxes & Charges"
						onPress={onTotalBillPress}
					/>
					: null}
			</View>
		</View>
	);
};

export default OrderReviewBottom;

const styles = StyleSheet.create({
	container: {

		marginTop: 24,
		paddingBottom: 16,
	},
	addNoteBtn: {


		gap: 6,
		marginBottom: 16,

		backgroundColor: COLORS.BUTTON_BACKGROUND,
		borderWidth: 1,
		borderColor: COLORS.CARD_BACKGROUND,
		borderRadius: 8, padding: 16
	},
	addNoteText: {
		fontSize: 14,
		color: COLORS.THEME_GREEN,
		fontFamily: FONTFAMILY.INTER_MEDIUM,
		fontWeight: "500",
	},
	noteText: {
		fontSize: 14,
		color: COLORS.NOTE_TEXT,
		fontFamily: FONTFAMILY.INTER_REGULAR,
		fontWeight: "400",
		marginTop: 8,
		marginStart: 24
	},
	offerCard: {
		backgroundColor: COLORS.BUTTON_BACKGROUND,
		borderRadius: 16,

		marginBottom: 24,
		borderWidth: 1,
		borderColor: COLORS.CARD_BACKGROUND,
	},
	offerHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 8,
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		backgroundColor: '#ECF0FE', padding: 16,
	},
	offerTitle: {
		fontSize: 12,
		color: COLORS.DISCOUNT_TEXT,
		fontFamily: FONTFAMILY.INTER_SEMIBOLD,
		fontWeight: "600",
	},
	offerText: {
		fontSize: 16,
		color: COLORS.LOGIN_SUBTITLE,
		fontFamily: FONTFAMILY.INTER_MEDIUM,

		padding: 16,
		textAlign: 'left',

	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: COLORS.BOTTOM_BLACK,
		fontFamily: FONTFAMILY.INTER_SEMIBOLD,
		marginBottom: 16,
		textAlign: 'left',
		flex: 1,

	},
});

