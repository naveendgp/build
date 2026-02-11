import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import CustomText from '../../../../components/Text';
import CustomBtn from '../../../../components/CustomBtn';
import { COLORS } from '../../../../constants';
import styles from './style';

interface AddNoteProps {
    onSubmit?: (note: string) => void;
    onCancel?: () => void;
    initialNote?: string;
}

const AddNote: React.FC<AddNoteProps> = ({
    onSubmit,
    onCancel,
    initialNote = '',
}) => {
    const [note, setNote] = useState(initialNote);

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit(note);
        }
    };

    return (
        <View style={styles.container}>
            {/* Title */}
            <CustomText style={styles.title}>Add A Note For The Shop</CustomText>

            {/* Text Input Field */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Type Your Note Here"
                    placeholderTextColor={COLORS.LOGIN_SUBTITLE}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    textAlignVertical="top"
                    numberOfLines={8}
                />
            </View>

            {/* Submit Button */}
            <CustomBtn
                title="Submit"
                onPress={handleSubmit}
                style={styles.submitButton}
                disabled={!note.trim()}
            />
        </View>
    );
};

export default AddNote;
