import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, TextInput } from 'react-native';
import CustomText from '../../../components/Text';
import CustomBtn from '../../../components/CustomBtn';
import CustomIcon from '../../../components/Icon';
import TimerIcon from '../../../assets/auto-generated-svg-icons/TimerIcon';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import styles from './style';

export type DialogType = 'offer' | 'serviceTime';

interface PricingDialogProps {
    visible: boolean;
    onClose: () => void;
    type: DialogType;
    title: string;
    onConfirm: (data: OfferData | ServiceTimeData) => void;
    initialData?: OfferData | ServiceTimeData;
}

export interface OfferData {
    offerPercentage: string;
    maxCap: string;
}

export interface ServiceTimeData {
    standardTime: string;
    expressTime: string;
}

const PricingDialog: React.FC<PricingDialogProps> = ({
    visible,
    onClose,
    type,
    title,
    onConfirm,
    initialData,
}) => {
    const [offerPercentage, setOfferPercentage] = useState(
        (initialData as OfferData)?.offerPercentage || '50',
    );
    const [maxCap, setMaxCap] = useState(
        (initialData as OfferData)?.maxCap || '100',
    );
    const [standardTime, setStandardTime] = useState(
        (initialData as ServiceTimeData)?.standardTime || '48 Hours',
    );
    const [expressTime, setExpressTime] = useState(
        (initialData as ServiceTimeData)?.expressTime || '8 Hours',
    );

    const handleConfirm = () => {
        if (type === 'offer') {
            onConfirm({ offerPercentage, maxCap });
        } else {
            onConfirm({ standardTime, expressTime });
        }
        onClose();
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
                    {/* Header */}
                    <View style={styles.header}>
                        <CustomText style={styles.title}>{title}</CustomText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <CustomIcon type="Feather" name="x" size={24} color={COLORS.BLACK} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {type === 'offer' ? (
                            <>
                                {/* Offer Percentage */}
                                <View style={styles.inputSection}>
                                    <CustomText style={styles.inputLabel}>
                                        Enter Your Offer In Percentage
                                    </CustomText>
                                    <View style={styles.inputContainer}>

                                        <TextInput
                                            style={styles.input}
                                            value={offerPercentage}
                                            onChangeText={setOfferPercentage}
                                            keyboardType="number-pad"
                                            placeholder="50"
                                            placeholderTextColor={COLORS.LOGIN_SUBTITLE}
                                        />
                                        <CustomText style={styles.percentageSymbol}>%</CustomText>

                                    </View>
                                    <CustomText style={styles.note}>
                                        Note: This offer will applicable only for this service
                                    </CustomText>
                                </View>

                                {/* Max Cap */}
                                <View style={styles.inputSection}>
                                    <CustomText style={styles.inputLabel}>Max Cap</CustomText>
                                    <View style={styles.inputContainer}>
                                        <CustomText style={styles.currencySymbol}>₹</CustomText>
                                        <TextInput
                                            style={styles.input}
                                            value={maxCap}
                                            onChangeText={setMaxCap}
                                            keyboardType="number-pad"
                                            placeholder="100"
                                            placeholderTextColor={COLORS.LOGIN_SUBTITLE}
                                        />
                                    </View>
                                    <CustomText style={styles.note}>
                                        Note: This will be the max discount price
                                    </CustomText>
                                </View>
                            </>
                        ) : (
                            <>
                                {/* Standard Service Time */}
                                <View style={styles.inputSection}>
                                    <View style={styles.labelRow}>
                                        <TimerIcon width={18} height={18} color={COLORS.INPUT_TEXT} />
                                        <CustomText style={styles.inputLabel}>
                                            Standard Service Time <CustomText style={styles.required}>*</CustomText>
                                        </CustomText>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <TimerIcon width={20} height={20} color={COLORS.LOGIN_SUBTITLE} />

                                        <TextInput
                                            style={styles.input}
                                            value={standardTime}
                                            onChangeText={setStandardTime}
                                            placeholder="48 Hours"
                                            placeholderTextColor={COLORS.LOGIN_SUBTITLE}
                                        />
                                    </View>
                                </View>

                                {/* Express Service Time */}
                                <View style={styles.inputSection}>
                                    <View style={styles.labelRow}>
                                        <CustomIcon
                                            type="MaterialIcons"
                                            name="bolt"
                                            size={20}
                                            color={COLORS.INPUT_TEXT}
                                        />
                                        <CustomText style={styles.inputLabel}>
                                            Express Service Time <CustomText style={styles.required}>*</CustomText>
                                        </CustomText>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <TimerIcon width={20} height={20} color={COLORS.LOGIN_SUBTITLE} />

                                        <TextInput
                                            style={styles.input}
                                            value={expressTime}
                                            onChangeText={setExpressTime}
                                            placeholder="8 Hours"
                                            placeholderTextColor={COLORS.LOGIN_SUBTITLE}
                                        />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Confirm Button */}
                    <View style={styles.buttonContainer}>
                        <CustomBtn
                            title="Confirm"
                            onPress={handleConfirm}
                            style={styles.confirmButton}
                            textStyle={styles.confirmButtonText}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default PricingDialog;

