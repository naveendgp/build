import React from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import CustomText from '../../../components/Text';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import { ServiceItem } from '../../../apiService/types/profileTypes';
import { COLORS } from '../../../constants/colors';
import styles from './style';

interface ServiceItemCardProps {
    item: ServiceItem;
    editableItem: ServiceItem;
    onUpdateField: (field: keyof ServiceItem, value: any) => void;
}

const ServiceItemCard: React.FC<ServiceItemCardProps> = ({
    item,
    editableItem,
    onUpdateField,
}) => {
    const isSelected = editableItem.is_active;

    // Check if both prices are entered
    const hasStandardPrice = editableItem.item_price && editableItem.item_price > 0;
    const hasExpressPrice = editableItem.express_price && editableItem.express_price > 0;
    const isCheckboxEnabled = hasStandardPrice && hasExpressPrice;

    return (
        <View style={styles.itemCard}>
            <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                    <TouchableOpacity
                        style={[
                            styles.checkbox,
                            isSelected ? styles.checkboxSelected : null,
                            !isCheckboxEnabled ? styles.checkboxDisabled : null,
                        ]}
                        onPress={() => {
                            if (isCheckboxEnabled) {
                                onUpdateField('is_active', !isSelected);
                            }
                        }}
                        disabled={!isCheckboxEnabled}
                        activeOpacity={isCheckboxEnabled ? 0.7 : 1}
                    >
                        {isSelected ? (
                            <CheckIcon width={16} height={16} color={COLORS.WHITE} />
                        ) : null}
                    </TouchableOpacity>
                    <CustomText style={styles.itemName}>
                        {item.item_name}
                    </CustomText>
                </View>
            </View>

            <View style={styles.priceRow}>
                <View style={styles.priceColumn}>
                    <CustomText style={styles.priceLabel}>Standard</CustomText>
                    <View style={styles.priceInputWrapper}>
                        <CustomText style={styles.currencySymbol}>₹</CustomText>
                        <TextInput
                            style={styles.priceInput}
                            value={editableItem.item_price?.toString() || ''}
                            onChangeText={text => {
                                const price = parseInt(text) || 0;
                                onUpdateField('item_price', price);
                            }}
                            keyboardType="number-pad"
                            placeholder="0"
                        />
                    </View>
                </View>

                <View style={styles.priceColumn}>
                    <CustomText style={styles.priceLabel}>Express</CustomText>
                    <View style={styles.priceInputWrapper}>
                        <CustomText style={styles.currencySymbol}>₹</CustomText>
                        <TextInput
                            style={styles.priceInput}
                            value={editableItem.express_price?.toString() || ''}
                            onChangeText={text => {
                                const price = parseInt(text) || 0;
                                onUpdateField('express_price', price);
                            }}
                            keyboardType="number-pad"
                            placeholder="0"
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ServiceItemCard;

