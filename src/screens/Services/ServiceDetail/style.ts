import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

export default StyleSheet.create({
    confirmButton: {
        backgroundColor: COLORS.ONBOARDING_BUTTON,
        width: '100%',
        borderRadius: 16,
        alignItems: "center",
        paddingVertical: 15,
        marginVertical: 12
    }, continueText: {
        color: COLORS.BUTTON_BACKGROUND,
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
    },
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
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderRadius: 16,

        marginBottom: 16,

    },
    offerCard: {
        backgroundColor: '#E3F2FD',
        borderColor: '#90CAF9',
    },
    toggleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        backgroundColor: COLORS.EXPRESS_BACKGROUND,
        padding: 8,
        paddingHorizontal: 16,
        borderTopEndRadius: 16,
        borderTopStartRadius: 16,
        borderColor: COLORS.EXPRESS_BORDER,
        borderWidth: 1
    },
    toggleCardTitle: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        color: COLORS.BLACK,
        fontWeight: '600',
    },
    subOptionsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        borderBottomEndRadius: 16,
        borderBottomStartRadius: 16,
        borderTopWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_INPUT,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: COLORS.CARD_BACKGROUND,
    },
    subOptionsContent: {
        flex: 1,
        gap: 12,
    },
    subOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    subOptionText: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        color: COLORS.INPUT_TEXT,
        fontWeight: '500',
    },
    lightningIcon: {
        fontSize: 20,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginLeft: 16,
        alignSelf: 'center',
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
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        color: COLORS.INPUT_TEXT,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
        borderRadius: 16,
        backgroundColor: COLORS.CARD_BACKGROUND,
        paddingHorizontal: 16,
        marginBottom: 6,
        paddingVertical: 10,
    },
    input: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        color: COLORS.BLACK,
        fontWeight: '500',
    },
    inputNote: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        color: COLORS.NOTE_TEXT,
        fontWeight: '400',
        lineHeight: 16,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 24,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        color: COLORS.BLACK,
        fontWeight: '700',
        marginBottom: 16,
    },
    categorySubtitle: {
        fontSize: 14,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        color: COLORS.LOGIN_SUBTITLE,
        fontWeight: '400',
        marginTop: 6
    },
    categoryList: {
        gap: 12,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
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

