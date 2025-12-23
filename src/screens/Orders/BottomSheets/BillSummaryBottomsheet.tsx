import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";
import CustomBottomSheet from "../../../components/BottomSheet";
import CustomText from "../../../components/Text";
import { useProfileStore } from "../../../apiService/store/useProfileStore";

export interface BillSummaryData {
    itemTotal: number;
    gst: number;
    gstPercentage: number;
    grandTotal: number;
    offerAmount?: number;
}

interface BillSummaryBottomsheetProps {
    isVisible: boolean;
    onClose: () => void;
    billData: BillSummaryData | null;
    isLoading?: boolean;
}

const BillSummaryBottomsheet: React.FC<BillSummaryBottomsheetProps> = ({
    isVisible,
    onClose,
    billData,
    isLoading = false,
}) => {
    const [showLoader, setShowLoader] = useState(false);

    const { profile } = useProfileStore();

    useEffect(() => {
        if (isVisible) {
            // Always show loader when bottom sheet opens
            setShowLoader(true);
        } else {
            // Reset loader state when bottom sheet closes
            setShowLoader(false);
        }
    }, [isVisible]);

    // Hide loader when data is ready (after 1 second delay)
    useEffect(() => {
        if (isVisible && showLoader) {
            if (billData && !isLoading) {
                // Data is ready, wait 1 second then hide loader
                const timer = setTimeout(() => {
                    setShowLoader(false);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [isVisible, showLoader, billData, isLoading]);

    return (
        <CustomBottomSheet
            isVisible={isVisible}
            onClose={onClose}
            bgColor={COLORS.WHITE}
            height={32}  // home screen height issue fix
            headerText="Bill Summary"
        >
            <View style={styles.container}>
                {showLoader ? (
                    <View style={styles.loaderWrapper}>
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
                        </View>
                    </View>
                ) : billData ? (
                    <View style={styles.billCard}>
                        <CustomText style={styles.billCardTitle}>Bill Summary</CustomText>
                        <CustomText style={styles.billCardSubtitle}>Incl. All taxes & Charges</CustomText>
                        <View style={styles.billRow}>
                            <CustomText style={styles.billLabel}>Item Total</CustomText>
                            <CustomText style={styles.billValue}>₹{billData.itemTotal}</CustomText>
                        </View>
                        <View style={styles.billRow}>
                            <CustomText style={styles.billLabelUnderlined}>
                                GST (Govt. Taxes) ₹{billData.gst} ({profile?.payment_config?.gst_percentage}% of Item Total)
                            </CustomText>
                        </View>

                        {(billData?.offerAmount || 0) > 0 && <View style={styles.billRow}>
                            <CustomText style={styles.billLabel}>Offer Amount</CustomText>
                            <CustomText style={styles.billValue}>₹{billData.offerAmount}</CustomText>
                        </View>
                        }
                        <View style={styles.billDivider} />
                        <View style={styles.billRow}>
                            <CustomText style={styles.grandTotalLabel}>Grand Total</CustomText>
                            <CustomText style={styles.grandTotalValue}>₹{billData.grandTotal}</CustomText>
                        </View>
                    </View>
                ) : null}
            </View>
        </CustomBottomSheet >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //   paddingHorizontal: 16,
        // paddingTop: 20,
    },
    billCard: {
        backgroundColor: COLORS.BUTTON_BACKGROUND,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    billCardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.TEXT_PRIMARY,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        marginBottom: 4,
    },
    billCardSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.NOTE_TEXT,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        marginBottom: 16,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    billLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.LOGIN_SUBTITLE,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        flex: 1,
    },
    billLabelUnderlined: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.LOGIN_SUBTITLE,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        flex: 1,
        textDecorationLine: 'underline',
    },
    billValue: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.TEXT_PRIMARY,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
    },
    billDivider: {
        height: 1,
        backgroundColor: COLORS.SEPARATOR,
        marginBottom: 12,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.TEXT_PRIMARY,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    },
    grandTotalValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.TEXT_PRIMARY,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    },
    loaderWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 40,
        minHeight: 200, // Match bill card height to prevent flickering
    },
    loaderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
});

export default BillSummaryBottomsheet;

