import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import CustomText from '../../../components/Text';
import ServiceAddedIcon from '../../../assets/auto-generated-svg-icons/ServiceAddedIcon';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import styles from './style';

interface ServiceAddedDialogProps {
    visible: boolean;
    onClose: () => void;
    onButtonPress?: () => void;
    title?: string;
    bodyText?: string | React.ReactNode;
}

const ServiceAddedDialog: React.FC<ServiceAddedDialogProps> = ({
    visible,
    onClose,
    onButtonPress,
    title,
    bodyText,
}) => {
    const handleButtonPress = () => {
        if (onButtonPress) {
            onButtonPress();
        } else {
            onClose();
        }
    };

    // Default texts
    const defaultTitle = "Your Details Have Been Sent For Review";
    const defaultBodyText = "We're reviewing your details. After approval, you'll be able to update your service prices and receive customer orders. The process may take up to 48 hours.";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                style={styles.overlay}
                onPress={onClose}
            >
                <View
                    style={styles.container}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Success Icon */}
                    <View style={styles.iconContainer}>
                        <ServiceAddedIcon width={70} height={70} />
                    </View>

                    {/* Main Heading */}
                    <CustomText style={styles.title}>
                        {title || defaultTitle}
                    </CustomText>

                    {/* Body Text */}
                    {typeof bodyText === 'string' ? (
                        <CustomText style={styles.bodyText}>
                            {bodyText || defaultBodyText}
                        </CustomText>
                    ) : (
                        <View style={styles.bodyTextContainer}>
                            {bodyText || (
                                <CustomText style={styles.bodyText}>
                                    {defaultBodyText}
                                </CustomText>
                            )}
                        </View>
                    )}



                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default ServiceAddedDialog;

