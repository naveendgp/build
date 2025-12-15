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

        // Construct WhatsApp URL
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}${encodedMessage ? `&text=${encodedMessage}` : ""}`;

        // Construct phone call URL as fallback
        const phoneCallUrl = `tel:${phoneNumber}`;

        // Try to open WhatsApp app first
        const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
        if (canOpenWhatsApp) {
            await Linking.openURL(whatsappUrl);
        } else {
            // Fallback to phone call
            const canOpenPhone = await Linking.canOpenURL(phoneCallUrl);
            if (canOpenPhone) {
                await Linking.openURL(phoneCallUrl);
            } else {
                Alert.alert("Error", "Unable to open WhatsApp or make a phone call.");
            }
        }
    } catch (error) {
        Alert.alert("Error", "Unable to open WhatsApp or make a phone call.");
    }
};

