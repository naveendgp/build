import React from "react";
import { View, StyleSheet } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import CustomInAppWebView from "../../../components/CustomInAppWebView";
import Toolbar from "../../../components/Toolbar";
import CustomText from "../../../components/Text";
import { COLORS } from "../../../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackgroundGradient from "../../../components/backgroundGradient";
type WebViewScreenRouteProp = RouteProp<RootStackParamList, "WebViewScreen">;

const WebViewScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const route = useRoute<WebViewScreenRouteProp>();
    const { url, title } = route.params || {};

    if (!url) {
        return (
            <View style={[styles.container, { marginTop: insets.top }]}>
                <View style={styles.errorContainer}>
                    <CustomText style={styles.errorText}>URL is missing</CustomText>
                </View>
            </View>
        );
    }

    return (
        <View>
            <BackgroundGradient />
            <CustomInAppWebView
                url={url}
                headerTitle={title || "Web View"}
            />
        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
    },
});

export default WebViewScreen;

