import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

export default StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: COLORS.WHITE,
        borderRadius: 16,
        padding: 16,
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '700',
        color: COLORS.TEXT_PRIMARY,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        marginBottom: 0,
    },
    inputSection: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.INPUT_TEXT,
    },
    required: {
        color: COLORS.ERROR,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        borderRadius: 16,
        backgroundColor: COLORS.CARD_BACKGROUND,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 8,
        gap: 8,
    },
    input: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.LOGIN_SUBTITLE,
        padding: 0,
        flex: 1,
    },
    currencySymbol: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.LOGIN_SUBTITLE,
    },
    percentageSymbol: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.LOGIN_SUBTITLE,
        marginLeft: 8,
    },
    note: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: '400',
        color: COLORS.NOTE_TEXT,
        lineHeight: 16,
    },
    buttonContainer: {
        width: '100%',
    },
    confirmButton: {
        backgroundColor: COLORS.THEME_GREEN,
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '600',
    },
});

