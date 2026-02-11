import React from "react";
import { View, StyleSheet } from "react-native";
import CustomText from "../Text";
import { COLORS, FONTFAMILY } from "../../constants";
import Ionicons from "react-native-vector-icons/Ionicons";

interface EmptyScreenProps {
    title?: string;
    subtitle?: string;
}

const EmptyScreen: React.FC<EmptyScreenProps> = ({
    title = "No Orders Yet",
    subtitle = "Let's place your first order!",
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="cube-outline" size={80} color={COLORS.BLACK} />
            </View>
            <CustomText style={styles.title} fontWeight="Bold">
                {title}
            </CustomText>
            <CustomText style={styles.subtitle} fontWeight="Regular">
                {subtitle}
            </CustomText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",

    },
    iconContainer: {
        width: 130,
        height: 130,
        borderRadius: 70,
        backgroundColor: COLORS.LIGHT_GRAY_3,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: "500",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.TEXT_GRAY,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: "400",
        textAlign: "center",
    },
});

export default EmptyScreen;

