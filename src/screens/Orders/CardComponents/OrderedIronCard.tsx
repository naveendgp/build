import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";

interface OrderedIronCardProps {
    itemName: string;
    category: string;
    quantity: string | number;
    amount: number;
}

const OrderedIronCard: React.FC<OrderedIronCardProps> = ({
    itemName,
    category,
    quantity,
    amount,
}) => {
    // Format quantity to always show 2 digits
    const formattedQuantity = typeof quantity === 'number'
        ? quantity.toString().padStart(2, '0')
        : quantity.padStart(2, '0');

    return (
        <View style={orderedItemStyles.card}>
            <Text style={orderedItemStyles.title}>{itemName}</Text>

            <View style={orderedItemStyles.detailsContainer}>
                {/* Category Section */}
                <View style={orderedItemStyles.section}>
                    <Text style={orderedItemStyles.label}>Category</Text>
                    <Text style={orderedItemStyles.value}>{category}</Text>
                </View>

                {/* Quantity Section */}
                <View style={[orderedItemStyles.section]}>
                    <Text style={orderedItemStyles.label}>Quantity</Text>
                    <Text style={orderedItemStyles.value}>{formattedQuantity}</Text>
                </View>

                {/* Amount Section */}
                <View style={[orderedItemStyles.section]}>
                    <Text style={orderedItemStyles.label}>Amount</Text>
                    <Text style={orderedItemStyles.value}>₹{amount}</Text>
                </View>
            </View>
        </View>
    );
};

export const orderedItemStyles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    title: {
        fontSize: 18,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        color: COLORS.INPUT_TEXT,
        marginBottom: 8,
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',

    },
    section: {
        flex: 1,
    },
    centerSection: {
        alignItems: 'center',
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: '400',
        color: COLORS.TEXT_GRAY,
        marginBottom: 4,
    },
    value: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        color: COLORS.INPUT_TEXT,
    },
});

export default OrderedIronCard;

