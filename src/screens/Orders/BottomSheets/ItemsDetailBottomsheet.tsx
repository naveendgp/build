import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";
import CustomBottomSheet from "../../../components/BottomSheet";
import OrderedIronCard from "../CardComponents/OrderedIronCard";
import OrderWashCard from "../CardComponents/OrderWashCard";

export interface OrderItem {
    id: string;
    type: 'iron' | 'wash';
    itemName?: string; // Required for iron items
    category?: string; // Required for iron items
    quantity: string | number;
    amount: number;
}

interface ItemsDetailBottomsheetProps {
    isVisible: boolean;
    onClose: () => void;
    title: string; // e.g., "Iron Item Details" or "Wash Item Details"
    items: OrderItem[];
    isWeightBased: boolean;
}

const ItemsDetailBottomsheet: React.FC<ItemsDetailBottomsheetProps> = ({
    isVisible,
    onClose,
    title,
    items,
    isWeightBased,
}) => {
    const totalItems = items.length;


    const renderItemCard = (item: OrderItem) => {
        if (!isWeightBased) {
            return (
                <OrderedIronCard
                    key={item.id}
                    itemName={item.itemName || ''}
                    category={item.category || ''}
                    quantity={item.quantity}
                    amount={item.amount}
                />
            );
        } else {
            return (
                <OrderWashCard
                    key={item.id}
                    quantity={item.quantity}
                    amount={item.amount}
                />
            );
        }
    };

    return (
        <CustomBottomSheet
            isVisible={isVisible}
            onClose={onClose}
            bgColor={COLORS.WHITE}
            height={75}
            headerText={title}
        >
            <View style={styles.container}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    {!isWeightBased ? <Text style={styles.totalItems}>Total Items - {totalItems}</Text> : null}
                </View>

                {/* Items List - CustomBottomSheet already has ScrollView */}
                {items?.length > 0 ? (
                    items?.map((item) => renderItemCard(item))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No items found</Text>
                    </View>
                )}
            </View>
        </CustomBottomSheet>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 20,
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontFamily: FONTFAMILY.INTER_BOLD,
        fontWeight: '700',
        color: COLORS.TEXT_PRIMARY,
        marginBottom: 14,
    },
    totalItems: {
        fontSize: 18,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.INPUT_TEXT,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        color: COLORS.TEXT_GRAY,
    },
});

export default ItemsDetailBottomsheet;

