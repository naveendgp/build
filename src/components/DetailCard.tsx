import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomText from "./Text";
import { COLORS, FONTFAMILY } from "../constants";
import SvgForwardRightBlackSvg from "../assets/auto-generated-svg-icons/ForwardRightBlackSvg";

interface DetailCardProps {
	iconName: React.ReactNode;
	title: string;
	subtitle: string;
	onPress?: () => void;
	iconSize?: number;
	iconColor?: string;
	arrowSize?: number;
	arrowColor?: string;
	showArrow?: boolean;
}

const DetailCard: React.FC<DetailCardProps> = ({
	iconName,
	showArrow = true,
	title,
	subtitle,
	onPress,
	iconSize = 24,
	iconColor = COLORS.LOGIN_SUBTITLE,
	arrowSize = 20,
	arrowColor = COLORS.BOTTOM_BLACK,
}) => {
	return (
		<TouchableOpacity onPress={showArrow ? onPress : undefined} style={styles.detailCard}>
			{iconName}
			<View style={styles.detailContent}>
				<CustomText style={styles.detailTitle}>{title}</CustomText>
				<CustomText style={styles.detailSubtitle}>{subtitle}</CustomText>
			</View>
			<View style={styles.arrowContainer}>
				{showArrow && <SvgForwardRightBlackSvg/>}
			</View>
		</TouchableOpacity>
	);
};

export default DetailCard;

const styles = StyleSheet.create({
	detailCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.CARD_BACKGROUND,
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: COLORS.BORDER_INPUT,
		gap: 8,
	},
	detailContent: {
		flex: 1,
	},
	detailTitle: {
		fontSize: 16,
		fontWeight: "500",
		color: COLORS.LOGIN_SUBTITLE,
		fontFamily: FONTFAMILY.INTER_MEDIUM,
		marginBottom: 4,
	},
	detailSubtitle: {
		fontSize: 14,
		color: COLORS.NOTE_TEXT,
		fontFamily: FONTFAMILY.INTER_REGULAR,
		fontWeight: "400",
	},
	arrowContainer: {
		justifyContent: "center",
		alignItems: "center",
	},
});

