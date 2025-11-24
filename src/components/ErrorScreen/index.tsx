import React from 'react';
import { View } from 'react-native';
import CustomText from '../Text';
import CustomBtn from '../CustomBtn';
import ConnectionErrorIcon from '../../assets/auto-generated-svg-icons/NetworkErrorIcon';
import { COLORS, FONTFAMILY } from '../../constants/colors';
import styles from './style';

interface ErrorScreenProps {
    title?: string;
    subtitle?: string;
    onRetry?: () => void;
    retryButtonText?: string;
    iconSize?: number;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({
    title = 'Something went wrong.',
    subtitle = 'Please try again.',
    onRetry,
    retryButtonText = 'Retry',
    iconSize = 150,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <ConnectionErrorIcon width={iconSize} height={iconSize} />
            </View>
            <CustomText style={styles.title}>{title}</CustomText>
            {subtitle && <CustomText style={styles.subtitle}>{subtitle}</CustomText>}
            {onRetry && (
                <View style={styles.buttonContainer}>
                    <CustomBtn
                        title={retryButtonText}
                        onPress={onRetry}
                        style={styles.retryButton}
                        textStyle={styles.retryButtonText}
                    />
                </View>
            )}
        </View>
    );
};

export default ErrorScreen;

