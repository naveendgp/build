import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SvgServerError from '../../assets/auto-generated-svg-icons/ServerError';
import { COLORS } from '../../constants/colors';
import { FONTFAMILY } from '../../constants/fonts';
import BackgroundGradient from '../../components/backgroundGradient';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    retryButtonText?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    message = 'Please Check After Sometime And Try Again',
    onRetry,
    retryButtonText = 'Retry',
}) => {
    return (
        <View style={styles.wrapper}>
            {/* <BackgroundGradient /> */}
            <View style={styles.contentContainer}>
                <View style={styles.iconContainer}>
                    <SvgServerError width={150} height={150} />
                </View>

                <Text style={styles.messageText}>{message}</Text>

                {onRetry && (
                    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                        <Text style={styles.retryButtonText}>{retryButtonText}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: '100%',
        backgroundColor: COLORS.WHITE,
    },
    contentContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageText: {
        fontSize: 20,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20 * 1.38,
        paddingHorizontal: 20,
        maxWidth: '90%',
    },
    retryButton: {
        borderWidth: 1,
        borderColor: COLORS.THEME_GREEN,
        backgroundColor: COLORS.CARD_BACKGROUND,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        minWidth: 175,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryButtonText: {
        fontSize: 16,
        color: COLORS.THEME_GREEN,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
    },
});

export default ErrorState;

