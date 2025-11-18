import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 12
    },
    sectionTitle: {
        fontSize: 24,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        color: COLORS.BOTTOM_BLACK,
        fontWeight: '700',
        marginVertical: 24,
    },
    toggleCard: {
        backgroundColor: COLORS.EXPRESS_BACKGROUND,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.EXPRESS_BORDER,
    },
    offerCard: {
        backgroundColor: '#E3F2FD',
        borderColor: '#90CAF9',
    },
    toggleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    toggleCardTitle: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        color: COLORS.BLACK,
        fontWeight: '600',
    },
    subOptionsContainer: {
        marginTop: 12,
        gap: 12,
    },
    subOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    subOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    subOptionText: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        color: COLORS.INPUT_TEXT,
        fontWeight: '400',
    },
    lightningIcon: {
        fontSize: 20,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    editText: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        color: COLORS.THEME_GREEN,
        fontWeight: '500',
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        color: COLORS.INPUT_TEXT,
        fontWeight: '500',
        marginBottom: 12,
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        borderRadius: 16,
        backgroundColor: COLORS.CARD_BACKGROUND,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        color: COLORS.BLACK,
        fontWeight: '400',
    },
    inputNote: {
        fontSize: 12,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        color: COLORS.NOTE_TEXT,
        fontWeight: '400',
        lineHeight: 16,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 18,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        color: COLORS.BLACK,
        fontWeight: '600',
        marginBottom: 8,
    },
    categorySubtitle: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        color: COLORS.LOGIN_SUBTITLE,
        fontWeight: '400',
        marginBottom: 16,
    },
    categoryList: {
        gap: 12,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
    },
    categoryItemText: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        color: COLORS.INPUT_TEXT,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        paddingBottom: 32,
        backgroundColor: COLORS.WHITE,
        borderTopWidth: 1,
        borderTopColor: COLORS.BORDER_INPUT,
    },
});

