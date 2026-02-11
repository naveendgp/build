import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTFAMILY } from "../../../constants";
import CustomBottomSheet from "../../../components/BottomSheet";
import CustomText from "../../../components/Text";
import CustomBtn from "../../../components/CustomBtn";
import SvgEmptyStar from "../../../assets/auto-generated-svg-icons/EmptyStar";
import SvgStarIcon from "../../../assets/auto-generated-svg-icons/StarIcon";
import FilledStar from "../../../assets/auto-generated-svg-icons/FilledStar";
import { orderService } from "../../../services/orderService";
import { showErrorToast, showSuccessToast } from "../../../components/Toast/Toast";

interface RatingBottomSheetProps {
    isVisible: boolean;
    onClose: () => void;
    vendorName: string;
    serviceName: string;
    orderId?: string;
    onSubmit?: (rating: number, comment: string) => void;
}

const RatingBottomSheet: React.FC<RatingBottomSheetProps> = ({
    isVisible,
    onClose,
    vendorName,
    serviceName,
    orderId,
    onSubmit,
}) => {
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleStarPress = (selectedRating: number) => {
        setRating(selectedRating);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            showErrorToast("Please select a rating");
            return;
        }

        if (!orderId) {
            showErrorToast("Order ID is missing");
            return;
        }

        if (!comment.trim()) {
            showErrorToast("Please share your experience");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await orderService.createReview({
                orderId,
                rating,
                comment: comment.trim(),
            });

            if (response.success) {
                showSuccessToast(response.message || "Review submitted successfully");
                // Call the onSubmit callback if provided
                if (onSubmit) {
                    onSubmit(rating, comment);
                }
                // Reset form after successful submission
                setRating(0);
                setComment("");
                onClose();
            } else {
                showErrorToast(response.error || response.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            showErrorToast("An error occurred while submitting your review");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Reset form when closing
        setRating(0);
        setComment("");
        onClose();
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => handleStarPress(i)}
                    activeOpacity={0.7}
                    style={styles.starButton}
                >
                    {i <= rating ? (
                        <FilledStar width={40} height={40} />
                    ) : (
                        <SvgEmptyStar width={40} height={40} />
                    )}
                </TouchableOpacity>
            );
        }
        return stars;
    };

    return (
        <CustomBottomSheet
            isVisible={isVisible}
            onClose={handleClose}
            bgColor={COLORS.WHITE}
            height={75}
            headerText={vendorName}
        >
            <View style={styles.container}>
                {/* Service Name */}
                <CustomText style={styles.shopName}>{vendorName}</CustomText>
                <CustomText style={styles.serviceText}>Service - {serviceName}</CustomText>

                {/* Experience Input Field */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Share Your Experience"
                        placeholderTextColor={COLORS.INPUT_TEXT}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        textAlignVertical="top"
                        numberOfLines={4}
                    />
                </View>

                {/* Rating Section */}
                <CustomText style={styles.rateLabel} fontWeight="Bold">
                    Rate
                </CustomText>
                <View style={styles.starsContainer}>
                    {renderStars()}
                </View>

                {/* Submit Button */}
                <CustomBtn
                    title="Submit"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                    disabled={rating === 0 || isSubmitting || !comment.trim()}
                    loading={isSubmitting}
                />
            </View>
        </CustomBottomSheet>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 24,
    },
    shopName: {
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: "600",
        fontSize: 24,
        color: COLORS.TEXT_PRIMARY,
        marginBottom: 12,
    },
    serviceText: {
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: "500",
        fontSize: 16,
        color: COLORS.TEXT_GRAY,
        marginBottom: 20,
    },
    inputContainer: {
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        marginBottom: 24,
        minHeight: 120,
    },
    textInput: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        color: COLORS.INPUT_TEXT,
        padding: 16,
        flex: 1,
    },
    rateLabel: {
        fontSize: 18,
        fontFamily: FONTFAMILY.INTER_BOLD,
        fontWeight: "700",
        color: COLORS.TEXT_PRIMARY,
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 32,
        gap: 8,
    },
    starButton: {
        marginRight: 4,
    },
    submitButton: {
        borderRadius: 12,
        backgroundColor: COLORS.ONBOARDING_BUTTON,
    },
});

export default RatingBottomSheet;

