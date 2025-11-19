import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

export default StyleSheet.create({
    itemCard: {
        backgroundColor: COLORS.BUTTON_BACKGROUND,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        backgroundColor: COLORS.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: COLORS.THEME_GREEN,
        borderColor: COLORS.THEME_GREEN,
    },
    itemName: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.TEXT_SECONDARY,
    },
    priceRow: {
        flexDirection: 'row',
        gap: 16,
    },
    priceColumn: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '400',
        color: COLORS.INPUT_TEXT,
        marginBottom: 8,
    },
    priceInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        borderRadius: 16,
        backgroundColor: COLORS.CARD_BACKGROUND,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    currencySymbol: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.LOGIN_SUBTITLE,
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.LOGIN_SUBTITLE,
    },
});

