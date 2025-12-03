import { Linking, Alert } from "react-native";

/**
 * Opens WhatsApp with a phone number and optional order ID
 * @param phoneNumber - The phone number to contact (without country code prefix)
 * @param orderId - Optional order ID to include in the message
 */
export const openWhatsApp = async (phoneNumber: string, orderId?: string) => {
    try {
        // Construct the message text if orderId is provided
        const message = orderId ? `Hello, I need support for Order ID: ${orderId}` : "";

        // Encode the message for URL
        const encodedMessage = message ? encodeURIComponent(message) : "";

        // Construct WhatsApp URLs
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}${encodedMessage ? `&text=${encodedMessage}` : ""}`;
        const whatsappWebUrl = `https://wa.me/${phoneNumber}${encodedMessage ? `?text=${encodedMessage}` : ""}`;

        // Try to open WhatsApp app first
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
            await Linking.openURL(whatsappUrl);
        } else {
            // Fallback to web URL
            await Linking.openURL(whatsappWebUrl);
        }
    } catch (error) {
        Alert.alert("Error", "Unable to open WhatsApp. Please make sure WhatsApp is installed.");
    }
};

