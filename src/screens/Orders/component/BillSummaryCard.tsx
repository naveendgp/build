import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import CustomText from '../../../components/Text';
import { COLORS } from '../../../constants/colors';
import { FONTFAMILY } from '../../../constants/fonts';

interface BillItem {
    label: string;
    amount: number;
}

interface BillSummaryCardProps {
    title?: string;
    subtitle?: string;
    billItems: BillItem[];
    grandTotal: number;
    offer?: number;
    cashRoundOff?: number;
    toPay: number;
    showSubtitle?: boolean;
    isWhiteBackground?: boolean;
}

const BillSummaryCard: React.FC<BillSummaryCardProps> = ({
    title = 'Bill Summary',
    subtitle,
    billItems,
    grandTotal,
    offer = 0,
    cashRoundOff,
    toPay,
    showSubtitle = true,
    isWhiteBackground = false,
}) => {
    // Calculate cash round off if not provided
    const calculatedCashRoundOff = cashRoundOff !== undefined
        ? cashRoundOff
        : grandTotal - offer - toPay;

    // Labels that should be underlined
    const underlinedLabels = ['Delivery Fee', 'Platform Fee', 'GST'];

    const shouldUnderline = (label: string) => underlinedLabels.includes(label);

    return (
        <View style={isWhiteBackground ? styles.whiteCard : styles.card}>
            <CustomText style={styles.sectionTitle}>{title}</CustomText>

            {showSubtitle && subtitle && (
                <CustomText style={styles.subtitle}>{subtitle}</CustomText>
            )}

            {/* Bill Items */}
            {billItems.map((item, index) => (
                <View key={index} style={styles.billRow}>
                    {shouldUnderline(item.label) ? (
                        <Text style={styles.billLabelUnderlined}>{item.label}</Text>
                    ) : (
                        <CustomText style={styles.billLabel}>{item.label}</CustomText>
                    )}
                    <CustomText style={styles.billValue}>
                        ₹{item.amount.toFixed(2)}
                    </CustomText>
                </View>
            ))}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Grand Total */}
            <View style={styles.billRow}>
                <CustomText style={styles.grandTotalLabel}>Grand Total</CustomText>
                <CustomText style={styles.grandTotalValue}>
                    ₹{grandTotal.toFixed(2)}
                </CustomText>
            </View>

            {/* Offer */}
            {offer > 0 && (
                <View style={styles.billRow}>
                    <CustomText style={styles.offerLabel}>Offer</CustomText>
                    <CustomText style={styles.offerValue}>
                        -₹{offer.toFixed(2)}
                    </CustomText>
                </View>
            )}

            {/* Cash Round Off */}
            {/* <View style={styles.billRow}>
                <Text style={styles.billLabelUnderlined}>Cash round Off</Text>
                <CustomText style={styles.billValue}>
                    ₹{calculatedCashRoundOff.toFixed(2)}
                </CustomText>
            </View> */}

            {/* Divider */}
            <View style={styles.divider} />

            {/* To Pay */}
            <View style={styles.billRowLast}>
                <CustomText style={styles.grandTotalLabel}>To Pay</CustomText>
                <CustomText style={styles.grandTotalValue}>
                    ₹{toPay.toFixed(2)}
                </CustomText>
            </View>
        </View>
    );
};

export default BillSummaryCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.BUTTON_BACKGROUND,
        borderRadius: 16,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    whiteCard: {
        borderRadius: 16,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 0, // No padding bottom, handled by ScrollView
        marginBottom: 0, // No margin bottom, handled by ScrollView
    },
    sectionTitle: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontSize: 20,
        color: COLORS.BLACK,
        fontWeight: '700',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        marginBottom: 16,
        fontWeight: '400',
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    billRowLast: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0, // No margin for last row, padding handled by ScrollView
    },
    billLabel: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        color: COLORS.LOGIN_SUBTITLE,
        fontSize: 14,
    },
    billLabelUnderlined: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        color: COLORS.LOGIN_SUBTITLE,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    billValue: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        color: COLORS.LOGIN_SUBTITLE,
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.TEXT_MUTED,
        marginVertical: 12,
    },
    grandTotalLabel: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '700',
        color: COLORS.BLACK,
        fontSize: 16,
    },
    grandTotalValue: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '700',
        color: COLORS.BLACK,
        fontSize: 16,
    },
    offerLabel: {
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '600',
        color: '#1562BB',
        fontSize: 16,
    },
    offerValue: {
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '600',
        color: '#1562BB',
        fontSize: 16,
    },
    toPayLabel: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        fontSize: 15,
        color: COLORS.BLACK,
    },
    toPayValue: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        fontSize: 15,
        color: COLORS.BLACK,
    },
});

