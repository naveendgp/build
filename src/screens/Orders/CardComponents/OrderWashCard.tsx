import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";
import { orderedItemStyles } from "./OrderedIronCard";

interface OrderWashCardProps {
    quantity: string | number;
    amount: number;
    itemName?: string;
    isVerified?: boolean;
}

const OrderWashCard: React.FC<OrderWashCardProps> = ({
    quantity,
    amount,
    itemName,
    isVerified,
}) => {
    // Format quantity - if number, add 'kg', otherwise use as is

    console.log("🚀 ~ OrderWashCard ~ quantity:", quantity)


    const formattedQuantity = typeof quantity === 'number'
        ? `${quantity}kg`
        : quantity;

    return (
        <View style={orderedItemStyles.card}>
            <View style={orderedItemStyles.detailsContainer}>
                {/* Quantity Section */}
                <View style={orderedItemStyles.section}>
                    <Text style={orderedItemStyles.label}>Quantity</Text>
                    <Text style={orderedItemStyles.value}>{isVerified ? `${quantity}kg` : `${itemName}`}</Text>
                </View>

                {/* Amount Section */}
                <View style={orderedItemStyles.section}>
                    <Text style={orderedItemStyles.label}>Amount</Text>
                    <Text style={orderedItemStyles.value}>₹{amount}/kg</Text>
                </View>
            </View>
        </View>
    );
};


export default OrderWashCard;

