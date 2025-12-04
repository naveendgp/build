import React from 'react';
import {
    Modal,
    View,
    Image,
    TouchableOpacity,
    Text,
    GestureResponderEvent,
} from 'react-native';
import styles from './styles';
import CustomBtn from '../CustomBtn';
import CustomText from '../Text';
import { COLORS, FONTFAMILY } from '../../constants/colors';

type Props = {
    visible: boolean;
    onClose?: (e?: GestureResponderEvent) => void;
    title?: string;
    subtitle?: string;
    imageSource?: any;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    onPrimaryButtonPress?: () => void;
    onSecondaryButtonPress?: () => void;
    closable?: boolean; // If false, dialog cannot be closed by tapping outside or close button
};

const DiscardDialog: React.FC<Props> = ({
    visible,
    onClose,
    title,
    subtitle,
    imageSource,
    primaryButtonText = 'Confirm',
    secondaryButtonText = 'Cancel',
    onPrimaryButtonPress,
    onSecondaryButtonPress,
    closable = true, // Default to closable
}) => {
    if (!visible) return null;

    const handleSecondaryPress = () => {
        if (onSecondaryButtonPress) {
            onSecondaryButtonPress();
        } else if (onClose) {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={closable ? onClose : undefined} // Prevent back button on Android if not closable
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={closable ? onClose : undefined} // Prevent closing on overlay tap if not closable
            >
                <View
                    style={styles.container}
                    onStartShouldSetResponder={() => true}
                >


                    {/* Image/Icon Container */}
                    {imageSource && (
                        <View style={styles.iconContainer}>
                            <Image
                                source={imageSource}
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </View>
                    )}

                    {/* Title */}
                    {title ? <CustomText style={styles.title}>{title}</CustomText> : null}

                    {/* Subtitle */}
                    {subtitle ? (
                        <CustomText style={styles.subtitle}>{subtitle}</CustomText>
                    ) : null}

                    {/* Dual Buttons */}
                    <View style={styles.actionRow}>


                        <CustomBtn
                            title={secondaryButtonText}
                            onPress={() => onSecondaryButtonPress && onSecondaryButtonPress()}
                            style={styles.secondaryButton}
                            textStyle={styles.secondaryButtonText}
                        />

                        <CustomBtn
                            title={primaryButtonText}
                            onPress={() => onPrimaryButtonPress && onPrimaryButtonPress()}
                            style={styles.primaryButton}
                            textStyle={styles.primaryButtonText}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default DiscardDialog;

