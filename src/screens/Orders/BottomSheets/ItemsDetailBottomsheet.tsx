import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";
import CustomBottomSheet from "../../../components/BottomSheet";
import OrderedIronCard from "../CardComponents/OrderedIronCard";
import OrderWashCard from "../CardComponents/OrderWashCard";
import { updateOrderItems } from "../../../apiService/api/ordersApi";
import { showSuccessToast, showErrorToast } from "../../../utils/Toast";

export interface OrderItem {
    id: string;
    type: 'iron' | 'wash';
    itemName?: string; // Required for iron items
    category?: string; // Required for iron items
    quantity: string | number;
    amount: number;
    weight?: number;
}

interface ItemsDetailBottomsheetProps {
    isVisible: boolean;
    onClose: () => void;
    title: string; // e.g., "Iron Item Details" or "Wash Item Details"
    items: OrderItem[];
    isWeightBased: boolean;
    isVerified: boolean | undefined;
    orderId: string;
    onUpdateSuccess?: () => void;
}

const ItemsDetailBottomsheet: React.FC<ItemsDetailBottomsheetProps> = ({
    isVisible,
    onClose,
    title,
    items,
    isWeightBased,
    isVerified,
    orderId,
    onUpdateSuccess,
}) => {
    const totalItems = items.length;
    const [editingItems, setEditingItems] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);

    const [editingTiers, setEditingTiers] = useState<Record<string, string>>({});

    // Initialize editingItems when items change or sheet opens
    useEffect(() => {
        if (isVisible && items.length > 0) {
            const initial: Record<string, number> = {};
            const initialTiers: Record<string, string> = {};
            items.forEach(item => {
                // Use weight if available and weight-based, else quantity
                const val = isWeightBased && item.weight !== undefined ? item.weight : Number(item.quantity) || 0;
                initial[item.id] = val;
                // Default tier
                initialTiers[item.id] = 'regular';
            });
            setEditingItems(initial);
            setEditingTiers(initialTiers);
        }
    }, [isVisible, items, isWeightBased]);

    const handleQuantityChange = (id: string, text: string) => {
        // Allow decimals
        const val = parseFloat(text);
        setEditingItems(prev => ({
            ...prev,
            [id]: isNaN(val) ? 0 : val
        }));
    };

    const handleTierChange = (id: string, tier: string) => {
        setEditingTiers(prev => ({
            ...prev,
            [id]: tier
        }));
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const updates = Object.entries(editingItems).map(([itemId, val]) => {
                const originalItem = items.find(i => i.id === itemId);
                if (!originalItem) return null;

                return {
                    item_id: itemId,
                    quantity: isWeightBased ? (Number(originalItem.quantity) || 0) : val,
                    weight: isWeightBased ? val : undefined,
                    pricing_tier: isWeightBased ? (editingTiers[itemId] || 'regular') : undefined,
                };
            }).filter(Boolean) as any[];

            if (updates.length === 0) {
                onClose();
                return;
            }

            const response = await updateOrderItems({
                order_id: orderId,
                items: updates
            });

            if (response.status) {
                showSuccessToast(response.message || 'Order items updated');
                onUpdateSuccess?.();
                onClose();
            } else {
                showErrorToast(response.message || 'Failed to update items');
            }
        } catch (error: any) {
            console.error('Update error:', error);
            showErrorToast(error?.response?.data?.message || 'Failed to update items');
        } finally {
            setIsSaving(false);
        }
    };

    const renderItemCard = (item: OrderItem) => {
        const currentVal = editingItems[item.id] !== undefined
            ? editingItems[item.id]
            : (isWeightBased ? (item.weight || 0) : (Number(item.quantity) || 0));

        // State for selected tier (local to this render?? No, needs to be in state)
        // We'll use a hack to store tier in a separate state map or combine it.
        // For simplicity let's stick to simple "Regular" as default if not selected.
        // Wait, we need to store tier selection.

        return (
            <View key={item.id}>
                {isWeightBased ? (
                    <View style={{ marginBottom: 16 }}>
                        <OrderWashCard
                            amount={item.amount}
                            itemName={item.itemName || ''}
                            isVerified={isVerified}
                            quantity={currentVal}
                            isEditable={true}
                            onQuantityChange={(text) => handleQuantityChange(item.id, text)}
                        />
                        {/* Tier Selection - Simple Row */}
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 16 }}>
                            {['regular', 'standard', 'max'].map((tier) => (
                                <TouchableOpacity
                                    key={tier}
                                    onPress={() => handleTierChange(item.id, tier)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 20,
                                        backgroundColor: (editingTiers[item.id] || 'regular') === tier ? COLORS.THEME_GREEN : COLORS.BORDER_INPUT,
                                    }}
                                >
                                    <Text style={{
                                        color: (editingTiers[item.id] || 'regular') === tier ? COLORS.WHITE : COLORS.TEXT_PRIMARY,
                                        fontSize: 12,
                                        fontFamily: FONTFAMILY.INTER_MEDIUM,
                                        textTransform: 'capitalize'
                                    }}>{tier}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    <OrderedIronCard
                        itemName={item.itemName || ''}
                        category={item.category || ''}
                        quantity={currentVal}
                        amount={item.amount}
                    />
                )}
            </View>
        );
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

                {/* Items List */}
                {items?.length > 0 ? (
                    items?.map((item) => renderItemCard(item))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No items found</Text>
                    </View>
                )}

                {/* Save Button */}
                {items?.length > 0 && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={COLORS.WHITE} size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
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
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.BORDER_INPUT,
    },
    saveButton: {
        backgroundColor: COLORS.THEME_GREEN,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_BOLD,
        fontWeight: '700',
    }
});

export default ItemsDetailBottomsheet;
