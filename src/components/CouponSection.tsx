import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Modal,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { OfferService } from '../services/offerService';
import { Offer, CouponValidationResponse } from '../types/offer';

interface CouponSectionProps {
    orderSubtotal: number;
    serviceIds?: string[];
    onCouponApplied: (
        code: string,
        discountAmount: number,
        offerDetails?: CouponValidationResponse['offer']
    ) => void;
    onCouponRemoved: () => void;
    appliedCouponCode?: string;
    appliedDiscount?: number;
}

const CouponSection: React.FC<CouponSectionProps> = ({
    orderSubtotal,
    serviceIds,
    onCouponApplied,
    onCouponRemoved,
    appliedCouponCode,
    appliedDiscount,
}) => {
    const [couponCode, setCouponCode] = useState(appliedCouponCode || '');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showOffersList, setShowOffersList] = useState(false);
    const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
    const [isLoadingOffers, setIsLoadingOffers] = useState(false);

    useEffect(() => {
        if (appliedCouponCode) {
            setCouponCode(appliedCouponCode);
        }
    }, [appliedCouponCode]);

    const fetchAvailableOffers = async () => {
        setIsLoadingOffers(true);
        const response = await OfferService.getUserOffers();
        if (response.success && response.data) {
            setAvailableOffers(response.data);
        }
        setIsLoadingOffers(false);
    };

    const handleApplyCoupon = async (code?: string) => {
        const codeToApply = code || couponCode.trim().toUpperCase();
        if (!codeToApply) {
            setError('Please enter a coupon code');
            return;
        }

        setIsValidating(true);
        setError(null);

        const response = await OfferService.validateCoupon(
            codeToApply,
            orderSubtotal,
            serviceIds
        );

        setIsValidating(false);

        if (response.success && response.data?.valid) {
            setCouponCode(codeToApply);
            onCouponApplied(codeToApply, response.data.discount_amount, response.data.offer);
            setShowOffersList(false);
        } else {
            setError(response.data?.message || response.error || 'Invalid coupon');
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setError(null);
        onCouponRemoved();
    };

    const handleShowOffers = () => {
        fetchAvailableOffers();
        setShowOffersList(true);
    };

    const renderOfferItem = ({ item }: { item: Offer }) => {
        const discountText = OfferService.formatDiscountText(item);
        const isApplicable = item.min_order_value <= orderSubtotal;

        return (
            <TouchableOpacity
                style={[styles.offerItem, !isApplicable && styles.offerItemDisabled]}
                onPress={() => isApplicable && handleApplyCoupon(item.code)}
                disabled={!isApplicable}
            >
                <View style={styles.offerHeader}>
                    <Text style={styles.offerCode}>{item.code}</Text>
                    <Text style={styles.offerDiscount}>{discountText}</Text>
                </View>
                <Text style={styles.offerTitle}>{item.title}</Text>
                {item.description && (
                    <Text style={styles.offerDescription}>{item.description}</Text>
                )}
                {item.min_order_value > 0 && (
                    <Text style={[
                        styles.offerMinOrder,
                        !isApplicable && styles.offerMinOrderNotMet
                    ]}>
                        Min. order: ₹{item.min_order_value}
                        {!isApplicable && ' (Not met)'}
                    </Text>
                )}
                {isApplicable && (
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApplyCoupon(item.code)}
                    >
                        <Text style={styles.applyButtonText}>APPLY</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Apply Coupon</Text>

            {appliedCouponCode && appliedDiscount ? (
                <View style={styles.appliedCouponContainer}>
                    <View style={styles.appliedCouponInfo}>
                        <Text style={styles.appliedCouponCode}>{appliedCouponCode}</Text>
                        <Text style={styles.appliedCouponDiscount}>
                            You save ₹{appliedDiscount.toFixed(2)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleRemoveCoupon}>
                        <Text style={styles.removeButton}>Remove</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter coupon code"
                        placeholderTextColor={COLORS.GRAY}
                        value={couponCode}
                        onChangeText={(text) => {
                            setCouponCode(text.toUpperCase());
                            setError(null);
                        }}
                        autoCapitalize="characters"
                    />
                    <TouchableOpacity
                        style={[styles.applyBtn, isValidating && styles.applyBtnDisabled]}
                        onPress={() => handleApplyCoupon()}
                        disabled={isValidating}
                    >
                        {isValidating ? (
                            <ActivityIndicator size="small" color={COLORS.WHITE} />
                        ) : (
                            <Text style={styles.applyBtnText}>Apply</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {!appliedCouponCode && (
                <TouchableOpacity
                    style={styles.viewOffersButton}
                    onPress={handleShowOffers}
                >
                    <Text style={styles.viewOffersText}>View Available Offers</Text>
                </TouchableOpacity>
            )}

            <Modal
                visible={showOffersList}
                animationType="slide"
                transparent
                onRequestClose={() => setShowOffersList(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Available Offers</Text>
                            <TouchableOpacity onPress={() => setShowOffersList(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {isLoadingOffers ? (
                            <ActivityIndicator size="large" color={COLORS.PRIMARY} style={styles.loader} />
                        ) : availableOffers.length === 0 ? (
                            <Text style={styles.noOffersText}>No offers available at the moment</Text>
                        ) : (
                            <FlatList
                                data={availableOffers}
                                renderItem={renderOfferItem}
                                keyExtractor={(item) => item._id}
                                contentContainerStyle={styles.offersList}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.BLACK,
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.LIGHT_GRAY,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.BLACK,
        textTransform: 'uppercase',
    },
    applyBtn: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 8,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    applyBtnDisabled: {
        opacity: 0.7,
    },
    applyBtnText: {
        color: COLORS.WHITE,
        fontWeight: '600',
        fontSize: 14,
    },
    appliedCouponContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4CAF50',
        borderStyle: 'dashed',
    },
    appliedCouponInfo: {},
    appliedCouponCode: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2E7D32',
    },
    appliedCouponDiscount: {
        fontSize: 12,
        color: '#388E3C',
        marginTop: 2,
    },
    removeButton: {
        color: '#D32F2F',
        fontWeight: '600',
        fontSize: 14,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 12,
        marginTop: 8,
    },
    viewOffersButton: {
        marginTop: 12,
    },
    viewOffersText: {
        color: COLORS.PRIMARY,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.WHITE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.LIGHT_GRAY,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.BLACK,
    },
    closeButton: {
        fontSize: 20,
        color: COLORS.GRAY,
        padding: 4,
    },
    loader: {
        marginVertical: 40,
    },
    noOffersText: {
        textAlign: 'center',
        color: COLORS.GRAY,
        fontSize: 14,
        marginVertical: 40,
    },
    offersList: {
        padding: 16,
    },
    offerItem: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.LIGHT_GRAY,
    },
    offerItemDisabled: {
        opacity: 0.6,
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    offerCode: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.PRIMARY,
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    offerDiscount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
    },
    offerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.BLACK,
        marginBottom: 4,
    },
    offerDescription: {
        fontSize: 12,
        color: COLORS.GRAY,
        marginBottom: 4,
    },
    offerMinOrder: {
        fontSize: 12,
        color: COLORS.GRAY,
        marginTop: 4,
    },
    offerMinOrderNotMet: {
        color: '#FF9800',
    },
    applyButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    applyButtonText: {
        color: COLORS.WHITE,
        fontSize: 12,
        fontWeight: '600',
    },
});

export default CouponSection;
