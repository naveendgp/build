import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from '../../../components/Text';
import { COLORS } from '../../../constants/colors';
import { FONTFAMILY } from '../../../constants/fonts';
import SvgForwardRightBlackSvg from '../../../assets/auto-generated-svg-icons/ForwardRightBlackSvg';
import ForwardWhiteIcon from '../../../assets/auto-generated-svg-icons/ForwardWhiteIcon';
import CustomDialog from '../../../components/CustomDialog';
import { orderService } from '../../../services/orderService';
import { showToast, showErrorToast } from '../../../components/Toast/Toast';

interface PaymentOptionsProps {
    amount: number;
    onCashOnDeliveryPress?: () => void;
    onPayOnlinePress?: () => void;
    isOrderAccepted?: boolean;
    orderId?: string;
    onOrderCancelled?: () => void;
    navigation?: any;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
    amount,
    onCashOnDeliveryPress,
    onPayOnlinePress,
    isOrderAccepted,
    orderId,
    onOrderCancelled,
    navigation
}) => {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancelOrder = () => {
        if (!orderId) {
            showErrorToast('Order ID is missing');
            return;
        }
        setShowCancelDialog(true);
    };

    const confirmCancelOrder = async () => {
        if (!orderId) {
            showErrorToast('Order ID is missing');
            setShowCancelDialog(false);
            return;
        }

        setIsCancelling(true);
        try {
            const response = await orderService.cancelOrder(orderId);

            if (response.success && response.data?.status) {
                showToast('Order cancelled successfully');
                setShowCancelDialog(false);
                if (onOrderCancelled) {
                    onOrderCancelled();
                }
                navigation.goBack();
            } else {
                showErrorToast(response.error || response.data?.message || 'Failed to cancel order');
            }
        } catch (error) {
            showErrorToast('Something went wrong. Please try again.');
            console.error('Error cancelling order:', error);
        } finally {
            setIsCancelling(false);
        }
    };
    return (
        <View style={paymentOptionsStyles.container}>
            {/* Cash on Delivery Button */}
            {isOrderAccepted &&
                <>
                    <TouchableOpacity
                        style={paymentOptionsStyles.cashOnDeliveryButton}
                        onPress={onCashOnDeliveryPress}
                        activeOpacity={0.8}
                    >
                        <View style={paymentOptionsStyles.buttonContent}>
                            <CustomText style={paymentOptionsStyles.cashOnDeliveryText}>
                                Cash on Delivery ₹ {amount.toFixed(2)}
                            </CustomText>
                            <SvgForwardRightBlackSvg />

                        </View>
                    </TouchableOpacity>

                    {/* Pay Online Button */}
                    <TouchableOpacity
                        style={paymentOptionsStyles.payOnlineButton}
                        onPress={onPayOnlinePress}
                        activeOpacity={0.8}
                    >
                        <View style={paymentOptionsStyles.buttonContent}>
                            <CustomText style={paymentOptionsStyles.payOnlineText}>
                                Pay online ₹ {amount.toFixed(2)}
                            </CustomText>
                            <ForwardWhiteIcon />

                        </View>
                    </TouchableOpacity>
                </>
            }

            {!isOrderAccepted &&

                <TouchableOpacity
                    style={paymentOptionsStyles.orderCancelledButton}
                    onPress={handleCancelOrder}
                    activeOpacity={0.8}
                    disabled={isCancelling}
                >
                    <View style={paymentOptionsStyles.buttonContent}>
                        <CustomText style={paymentOptionsStyles.payOnlineText}>
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </CustomText>

                    </View>
                </TouchableOpacity>}

            {/* Cancel Order Confirmation Dialog */}
            <CustomDialog
                visible={showCancelDialog}
                title="Cancel Order"
                content="Are you sure you want to cancel this order? This action cannot be undone."
                onClose={() => setShowCancelDialog(false)}
                onConfirm={confirmCancelOrder}
                confirmText="Yes, Cancel"
                cancelText="No"
                isRed={true}
            />
        </View>
    );
};

export default PaymentOptions;

export const paymentOptionsStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,

        gap: 16,
    },
    cashOnDeliveryButton: {
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.ACCENT,
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    payOnlineButton: {
        backgroundColor: COLORS.ACCENT,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderCancelledButton: {
        backgroundColor: COLORS.RED,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cashOnDeliveryText: {
        fontSize: 16,
        color: COLORS.ACCENT,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        marginRight: 8,
    },
    payOnlineText: {
        fontSize: 16,
        color: COLORS.BUTTON_BACKGROUND,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        marginRight: 8,
    },
});

