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
}

const ServiceAddedDialog: React.FC<ServiceAddedDialogProps> = ({
    visible,
    onClose,
    onButtonPress,
}) => {
    const handleButtonPress = () => {
        if (onButtonPress) {
            onButtonPress();
        } else {
            onClose();
        }
    };

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
                        Your Details Have Been Sent For Review
                    </CustomText>

                    {/* Body Text */}
                    <CustomText style={styles.bodyText}>
                        Once you have approved you will be able to receive orders from customers. It may take up to{' '}
                        <CustomText style={styles.boldText}>48 hours to verify your details.</CustomText>
                    </CustomText>



                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default ServiceAddedDialog;

