import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import CustomText from "../../components/Text";
import CustomBtn from "../../components/CustomBtn";
import { COLORS, FONTFAMILY } from "../../constants";

interface ServiceTypeBottomSheetContentProps {
    express: boolean;
    onSelect: (isExpress: boolean) => void;
    onConfirm: () => void;
    deliveryTime: {
        standard: string;
        express: string;
    }
}

const ServiceTypeBottomSheetContent: React.FC<ServiceTypeBottomSheetContentProps> = ({
    express,
    onSelect,
    onConfirm,
    deliveryTime
}) => {



    return (
        <View style={styles.container}>
            {/* Title */}
            <CustomText style={styles.title}>Service Type</CustomText>

            {/* Standard Service Option */}
            <TouchableOpacity
                style={styles.standardOptionContainer}
                onPress={() => onSelect(false)}
                activeOpacity={0.7}
            >
                <View style={styles.radioContainer}>
                    <View style={[
                        styles.radioOuter,
                        !express ? styles.radioSelectedOuter : styles.radioUnselectedOuter,
                    ]}>
                        {!express && <View style={styles.radioInner} />}
                    </View>
                </View>
                <CustomText style={styles.optionText}>
                    Standard Service {deliveryTime.standard}
                </CustomText>
            </TouchableOpacity>

            {/* Express Service Option */}
            <TouchableOpacity
                style={styles.expressOptionContainer}
                onPress={() => onSelect(true)}
                activeOpacity={0.7}
            >
                <View style={styles.radioContainer}>
                    <View style={[
                        styles.radioOuter,
                        express ? styles.radioSelectedOuter : styles.radioUnselectedOuterExpress,
                    ]}>
                        {express && <View style={styles.radioInner} />}
                    </View>
                </View>
                <CustomText style={styles.optionText}>
                    Express Service in {deliveryTime.express}
                </CustomText>
            </TouchableOpacity>

            {/* Note */}
            <CustomText style={styles.noteText}>
                Note: Price may vary
            </CustomText>

            {/* Confirm Button */}
            <CustomBtn
                title="Confirm"
                onPress={onConfirm}
                variant="primary"
                style={styles.confirmButton}
            />
        </View>
    );
};

export default ServiceTypeBottomSheetContent;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        marginHorizontal: 16
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        color: COLORS.TEXT_PRIMARY,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        marginTop: 16,

    },

    expressOptionContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.Express_background,
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        //marginBottom: 12,
        borderWidth: 1,

        borderColor: COLORS.EXPRESS_BORDER,
    },
    standardOptionContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.WHITE,
        borderRadius: 12,
        padding: 16,

        marginTop: 24,
        //marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER_LIGHT,
    },
    radioContainer: {
        marginRight: 12,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.BORDER_INPUT,
        justifyContent: "center",
        alignItems: "center",
    },
    radioSelectedOuter: {
        borderColor: COLORS.THEME_GREEN,
        backgroundColor: COLORS.WHITE,
    },
    radioUnselectedOuter: {
        borderColor: COLORS.BORDER_INPUT,
        backgroundColor: COLORS.WHITE,
    },
    radioUnselectedOuterExpress: {
        borderColor: COLORS.EXPRESS_BORDER,
        backgroundColor: COLORS.Express_background,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.THEME_GREEN,
    },
    optionText: {
        fontSize: 16,
        color: COLORS.TEXT_PRIMARY,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: "400",
        flex: 1
    },
    noteText: {
        fontSize: 14,
        color: COLORS.NOTE_TEXT,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: "400",
        marginTop: 6,

    },
    confirmButton: {
        marginTop: 16,

    },
});

