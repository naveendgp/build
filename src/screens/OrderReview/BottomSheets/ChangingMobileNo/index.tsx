import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import CustomTextInput from '../../../../components/TextInput';
import CustomBtn from '../../../../components/CustomBtn';
import CustomText from '../../../../components/Text';
import { COLORS, FONTFAMILY } from '../../../../constants';
import ProfileInput from '../../../../components/ProfileInput';

interface ChangingMobileNoProps {
    initialName?: string;
    initialNumber?: string;
    initialCountryCode?: string;
    onSubmit?: (name: string, countryCode: string, number: string) => void;
    onCancel?: () => void;
}

const ChangingMobileNo: React.FC<ChangingMobileNoProps> = ({
    initialName = '',
    initialNumber = '',
    initialCountryCode = '+91',
    onSubmit,
    onCancel,
}) => {
    const [name, setName] = useState(initialName);
    const [number, setNumber] = useState(initialNumber);
    const [countryCode, setCountryCode] = useState(initialCountryCode);

    const handleConfirm = () => {
        if (name.trim() && number.trim()) {
            onSubmit?.(name.trim(), countryCode, number.trim());
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View
                style={styles.scrollContent}

            >
                {/* Header */}
                <CustomText style={styles.headerText}>Contact Information</CustomText>

                <ProfileInput
                    label="Name"
                    required
                    inputType="normal"
                    value={name}
                    onChangeText={setName}
                />

                <ProfileInput
                    label="Number"
                    required
                    inputType="phone"
                    value={number}
                    onChangeText={setNumber}
                    countryCode="+91"
                />

                {/* Note */}
                <CustomText style={styles.noteText}>Note: Rider will contact this number</CustomText>


                {/* Confirm Button */}
                <View style={styles.buttonContainer}>
                    <CustomBtn
                        title="Confirm"
                        onPress={handleConfirm}
                        disabled={!name.trim() || !number.trim()}
                        style={styles.confirmButton}
                        textStyle={styles.confirmButtonText}
                    />
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChangingMobileNo;

const styles = StyleSheet.create({
    container: {
        flex: 1,
       // backgroundColor: COLORS.WHITE,
    },
    scrollContent: {
        padding: 16,
       // paddingTop: 24,
    },
    headerText: {
        fontSize: 20,
        fontFamily: FONTFAMILY.INTER_BOLD,
        fontWeight: '700',
        color: COLORS.BOTTOM_BLACK,
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputWrapper: {
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    input: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.BOTTOM_BLACK,
        padding: 0,
    },
    labelText: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.INPUT_TEXT,
        marginBottom: 8,
    },
    numberInputRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: 8,
    },
    countryCodeContainer: {
        marginRight: 8,
        zIndex: 1,
    },
    numberInputContainer: {
        flex: 1,
    },
    noteText: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: '400',
        color: COLORS.NOTE_TEXT,

        marginLeft: 4,
    },
    buttonContainer: {
        marginTop: 24,

    },
    confirmButton: {
        backgroundColor: COLORS.ONBOARDING_BUTTON,
        borderRadius: 12,
        paddingVertical: 16,
    },
    confirmButtonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
    },
});

