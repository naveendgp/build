import { Linking, Alert } from "react-native";
import { showErrorToast } from "../components/Toast/Toast";

/**
 * Opens WhatsApp with a phone number and optional order ID
 * @param phoneNumber - The phone number to contact (without country code prefix)
 * @param orderId - Optional order ID to include in the message
 */
export const openWhatsApp = async (
    phoneNumber: string,
    orderId?: string
) => {
    try {
        if (!phoneNumber) {
            showErrorToast("Phone number is missing.");
            return;
        }

        // 🔹 Normalize number (India default)
        // Remove spaces, +, -
        const cleanedNumber = phoneNumber.replace(/[^\d]/g, "");

        const formattedNumber = cleanedNumber.startsWith("91")
            ? cleanedNumber
            : `91${cleanedNumber}`;

        console.log("Opening WhatsApp for:", formattedNumber);

        // 🔹 Message
        const message = orderId
            ? `Hello, I need support for Order ID: ${orderId}`
            : "Hello, I need support";

        const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(
            message
        )}`;

        // 🔹 Open WhatsApp (works even without canOpenURL)
        await Linking.openURL(whatsappUrl);
    } catch (error) {
        console.log("WhatsApp open failed:", error);

        // ☎️ Fallback: Phone call
        try {
            await Linking.openURL(`tel:${phoneNumber}`);
        } catch {
            showErrorToast("Unable to open WhatsApp or make a phone call. Please try again later.");
        }
    }
};

