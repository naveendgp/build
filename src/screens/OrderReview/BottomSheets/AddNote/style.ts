import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../../constants';

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    
    },
    title: {
        fontSize: 20,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '700',
        color: COLORS.TEXT_PRIMARY,
        marginBottom: 24,
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
    submitButton: {
        borderRadius: 12,
        backgroundColor: COLORS.ONBOARDING_BUTTON,
    },
});

