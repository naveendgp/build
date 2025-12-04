import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, TextInput } from 'react-native';
import CustomText from '../../../components/Text';
import CustomBtn from '../../../components/CustomBtn';
import CustomIcon from '../../../components/Icon';
import SvgClockIcon from '../../../assets/auto-generated-svg-icons/ClockIcon';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import styles from './style';
import SvgCloseIcon from '../../../assets/auto-generated-svg-icons/CloseIcon';
import SvgCountownIcon from '../../../assets/auto-generated-svg-icons/CountownIcon';
import SvgExpressIcon from '../../../assets/auto-generated-svg-icons/ExpressIcon';

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
    offerPercentage: number;
    maxCap: number;
}

export interface ServiceTimeData {
    standardTime: number;
    expressTime: number;
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
        (initialData as OfferData)?.offerPercentage || 0,
    );
    const [maxCap, setMaxCap] = useState(
        (initialData as OfferData)?.maxCap || 0,
    );
    const [standardTime, setStandardTime] = useState(
        (initialData as ServiceTimeData)?.standardTime || 0,
    );
    const [expressTime, setExpressTime] = useState(
        (initialData as ServiceTimeData)?.expressTime || 0,
    );

    // Reset state when dialog opens or closes without confirming
    useEffect(() => {
        if (visible) {
            // When dialog opens, reset to initialData values
            if (type === 'offer') {
                setOfferPercentage((initialData as OfferData)?.offerPercentage || 0);
                setMaxCap((initialData as OfferData)?.maxCap || 0);
            } else {
                setStandardTime((initialData as ServiceTimeData)?.standardTime || 0);
                setExpressTime((initialData as ServiceTimeData)?.expressTime || 0);
            }
        }
    }, [visible, type, initialData]);

    // Check if confirm button should be disabled
    const isConfirmDisabled = () => {
        if (type === 'offer') {
            return offerPercentage === 0 || maxCap === 0;
        } else {
            return standardTime === 0 || expressTime === 0;
        }
    };

    const handleConfirm = () => {
        if (isConfirmDisabled()) {
            return;
        }
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
                            <SvgCloseIcon />
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
                                            value={offerPercentage > 0 ? offerPercentage.toString() + " %" : ""}
                                            onChangeText={(text) => {
                                                // Remove " %" if present and parse number
                                                const cleanText = text.replace(/\s*%\s*/g, '').trim();
                                                const num = cleanText ? parseInt(cleanText, 10) : 0;
                                                setOfferPercentage(isNaN(num) ? 0 : num);
                                            }}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor={COLORS.LOGIN_SUBTITLE}
                                        />

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
                                            value={maxCap.toString()}
                                            onChangeText={(text) => {
                                                const num = text ? parseInt(text, 10) : 0;
                                                setMaxCap(isNaN(num) ? 0 : num);
                                            }}
                                            keyboardType="number-pad"
                                            placeholder={maxCap.toString()}
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
                                        <SvgCountownIcon />
                                        <CustomText style={styles.inputLabel}>
                                            Standard Service Time <CustomText style={styles.required}>*</CustomText>
                                        </CustomText>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <SvgClockIcon color={COLORS.LOGIN_SUBTITLE} />

                                        <TextInput
                                            style={styles.input}
                                            value={standardTime.toString()}
                                            onChangeText={(text) => {
                                                const num = text ? parseInt(text, 10) : 0;
                                                setStandardTime(isNaN(num) ? 0 : num);
                                            }}
                                            keyboardType="number-pad"
                                            placeholder={standardTime.toString()}
                                            placeholderTextColor={COLORS.LOGIN_SUBTITLE}
                                        />
                                    </View>
                                </View>

                                {/* Express Service Time */}
                                <View style={styles.inputSection}>
                                    <View style={styles.labelRow}>
                                        <SvgExpressIcon />
                                        <CustomText style={styles.inputLabel}>
                                            Express Service Time <CustomText style={styles.required}>*</CustomText>
                                        </CustomText>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <SvgClockIcon color={COLORS.LOGIN_SUBTITLE} />

                                        <TextInput
                                            style={styles.input}
                                            value={expressTime.toString()}
                                            onChangeText={(text) => {
                                                const num = text ? parseInt(text, 10) : 0;
                                                setExpressTime(isNaN(num) ? 0 : num);
                                            }}
                                            keyboardType="number-pad"
                                            placeholder={expressTime.toString()}
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
                            disabled={isConfirmDisabled()}
                            style={isConfirmDisabled() ? styles.disabledButton : styles.confirmButton}
                            textStyle={styles.confirmButtonText}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default PricingDialog;

