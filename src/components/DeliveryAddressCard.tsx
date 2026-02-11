import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import CustomText from './Text';
import LocationIcon from '../assets/auto-generated-svg-icons/LocationIcon';
import { COLORS, FONTFAMILY } from '../constants';
import SvgLocation20Icon from '../assets/auto-generated-svg-icons/Location20Icon';
import SvgLocationLineBlackIcon from '../assets/auto-generated-svg-icons/LocationLineBlackIcon';

interface DeliveryAddressCardProps {
    addressType: string; // e.g., "Other", "Home", "Work"
    address: string;
    isSelected?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSelect?: () => void;
    isDeleting?: boolean; // Optional: show loading state during delete
    isDefault?: boolean;
    disabled?: boolean; // Optional: grey out and disable selection
}

const DeliveryAddressCard: React.FC<DeliveryAddressCardProps> = ({
    addressType,
    address,
    isSelected = false,
    onEdit,
    onDelete,
    onSelect,
    isDeleting = false,
    isDefault = false,
    disabled = false,
}) => {
    return (
        <View style={[styles.container, disabled && styles.disabledContainer]}>
            {/* Entire card is clickable except action buttons */}
            <TouchableOpacity
                style={styles.cardContent}
                onPress={onSelect}
                activeOpacity={disabled ? 1 : 0.7}
                disabled={!onSelect}
            >
                {/* Header: Delivery at with Radio Button */}
                <View style={styles.headerRow}>
                    <View style={[styles.radioButtonContainer, disabled && styles.disabledRadioButton]}>
                        {isSelected && <View style={styles.radioButtonInner} />}
                    </View>
                    <CustomText style={[styles.deliveryText, disabled && styles.disabledText]}>Pickup/Delivery at</CustomText>
                </View>

                {/* Address Type with Location Icon */}
                <View style={styles.addressTypeRow}>
                    <SvgLocationLineBlackIcon />
                    <CustomText style={[styles.addressTypeText, disabled && styles.disabledText]}>{addressType}</CustomText>
                </View>

                {/* Address Details */}
                <CustomText style={[styles.addressText, disabled && styles.disabledText]}>
                    {address}
                </CustomText>
            </TouchableOpacity>

            {/* Action Buttons - Separate from card click */}
            <View style={styles.actionRow}>
                <TouchableOpacity onPress={onEdit} activeOpacity={0.7} disabled={isDeleting || disabled}>
                    <CustomText style={[styles.editButton, (isDeleting || disabled) && styles.disabled]}>Edit</CustomText>
                </TouchableOpacity>
                {!isDefault && <TouchableOpacity onPress={onDelete} activeOpacity={0.7} disabled={isDeleting || disabled}>
                    <CustomText style={[styles.deleteButton, (isDeleting || disabled) && styles.disabled]}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </CustomText>
                </TouchableOpacity>}
            </View>
        </View>
    );
};

export default DeliveryAddressCard;

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        padding: 12,
        marginBottom: 16,
    },
    cardContent: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    radioButtonContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.THEME_GREEN,
        backgroundColor: COLORS.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioButtonInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.THEME_GREEN,
    },
    deliveryText: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.BOTTOM_BLACK,
    },
    addressTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressTypeText: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.INPUT_TEXT,
        marginLeft: 8,
    },
    addressText: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: '400',
        color: COLORS.LOGIN_SUBTITLE,
        lineHeight: 20,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',

    },
    editButton: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.THEME_GREEN,
        marginRight: 16,
    },
    deleteButton: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.RED,
    },
    disabled: {
        opacity: 0.5,
    },
    disabledContainer: {
        opacity: 0.5,
        backgroundColor: COLORS.CARD_BACKGROUND,
    },
    disabledRadioButton: {
        borderColor: COLORS.LOGIN_SUBTITLE,
    },
    disabledText: {
        color: COLORS.LOGIN_SUBTITLE,
    },
});

