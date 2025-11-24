import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import CustomText from '../../../components/Text';
import { ServiceByState } from '../../../apiService/types/profileTypes';
import RightArrowIcon from '../../../assets/auto-generated-svg-icons/RightArrowIcon';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';

interface ServiceItemCardProps {
    item: ServiceByState;
    isVerified: boolean;
    isSelected: boolean;
    onToggle: (serviceId: string) => void;
    onPress: (service: ServiceByState) => void;
    isArrowVisible?: boolean;
    showCheckbox?: boolean;
    showItemsCount?: boolean;
}

const ServiceItemCard: React.FC<ServiceItemCardProps> = ({
    item,
    isVerified,
    isSelected,
    onToggle,
    onPress,
    isArrowVisible = true,
    showCheckbox = true,
    showItemsCount = false,
}) => {
    // Determine if checkbox is in minus state (non-editable)
    const isMinus = !isVerified && item.is_active && !item.is_approved;

    // For checked/unchecked states, use isSelected (user selection)
    // For minus state, show minus icon (non-editable) with unchecked styling
    const showChecked = !isMinus && isSelected;
    const isEditable = !isMinus;

    // When minus, don't apply selected styles (use unchecked appearance)
    const cardIsSelected = !isMinus && isSelected;
    const checkboxIsSelected = !isMinus && showChecked;
    const textIsSelected = !isMinus && isSelected;

    return (
        <View>
            <View
                style={[
                    styles.serviceOptionCard,
                    cardIsSelected && styles.serviceOptionCardSelected,
                ]}
            >
                <View style={styles.serviceOptionLeft}>
                    {showCheckbox && (
                        <TouchableOpacity
                            onPress={() => isEditable && onToggle(item.service_id)}
                            activeOpacity={isEditable ? 0.7 : 1}
                            disabled={!isEditable}
                        >
                            <View
                                style={[
                                    styles.serviceCheckbox,
                                    checkboxIsSelected && styles.serviceCheckboxSelected,
                                    !isVerified && !checkboxIsSelected && !isMinus && styles.serviceCheckboxUnverified,
                                ]}
                            >
                                {isMinus ? (
                                    <CustomText style={styles.minusIcon}>−</CustomText>
                                ) : showChecked ? (
                                    <CheckIcon width={16} height={16} color={COLORS.WHITE} />
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.serviceInfo}
                        onPress={() => onPress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.serviceNameContainer}>
                            <CustomText
                                style={[
                                    styles.serviceOptionName,
                                    textIsSelected && styles.serviceOptionNameSelected,
                                ]}
                            >
                                {item.service_name}
                            </CustomText>

                        </View>
                        {isArrowVisible && <RightArrowIcon width={24} height={24} color={COLORS.INPUT_TEXT} />}
                    </TouchableOpacity>

                </View>

                <View style={styles.serviceOptionRight}>
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            style={styles.serviceImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.serviceImagePlaceholder} />
                    )}
                </View>

            </View>
            {
                !isVerified && (
                    <CustomText style={styles.underVerificationText}>
                        Under Verification
                    </CustomText>
                )
            }

            {
                showItemsCount && (
                    <CustomText style={styles.underVerificationText}>
                        Selected Items - {item.active_items_count}/{item.total_items_count}
                    </CustomText>
                )
            }
        </View>
    );
};

export default ServiceItemCard;

