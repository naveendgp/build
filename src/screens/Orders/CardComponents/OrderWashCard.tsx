import { View, Text, StyleSheet, TextInput } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";
import { orderedItemStyles } from "./OrderedIronCard";

interface OrderWashCardProps {
    quantity: string | number;
    amount: number;
    itemName?: string;
    isVerified?: boolean;
    isEditable?: boolean;
    onQuantityChange?: (val: string) => void;
}

const OrderWashCard: React.FC<OrderWashCardProps> = ({
    quantity,
    amount,
    itemName,
    isVerified,
    isEditable,
    onQuantityChange,
}) => {
    // Format quantity - if number, add 'kg', otherwise use as is
    console.log("🚀 ~ OrderWashCard ~ quantity:", quantity)

    return (
        <View style={orderedItemStyles.card}>
            <View style={orderedItemStyles.detailsContainer}>
                {/* Quantity Section */}
                <View style={orderedItemStyles.section}>
                    <Text style={orderedItemStyles.label}>Quantity</Text>
                    {isEditable ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput
                                style={{
                                    borderBottomWidth: 1,
                                    borderBottomColor: COLORS.BORDER_INPUT,
                                    fontFamily: FONTFAMILY.INTER_BOLD,
                                    fontSize: 14,
                                    color: COLORS.TEXT_PRIMARY,
                                    width: 60,
                                    paddingVertical: 2,
                                    textAlign: 'center'
                                }}
                                value={String(quantity)}
                                onChangeText={onQuantityChange}
                                keyboardType="numeric"
                            />
                            <Text style={orderedItemStyles.value}> kg</Text>
                        </View>
                    ) : (
                        <Text style={orderedItemStyles.value}>{isVerified ? `${quantity}kg` : `${itemName}`}</Text>
                    )}
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

