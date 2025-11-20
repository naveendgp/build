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
    summaryBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,

    },
    totalItemsText: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        color: COLORS.INPUT_TEXT,
    },
    clearAllText: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '700',
        color: COLORS.ERROR,
    },
    itemsList: {
        padding: 20,
        paddingBottom: 10,
    },
    submitContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.BUTTON_BACKGROUND,
        borderTopWidth: 1,
        borderTopColor: COLORS.BORDER_INPUT,
        paddingVertical: 16,
        paddingHorizontal: 12
    },
});
