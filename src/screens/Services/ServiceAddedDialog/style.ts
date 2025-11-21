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
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    iconContainer: {
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '700',
        color: COLORS.BOTTOM_BLACK,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
    },
    bodyText: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: '400',
        color: COLORS.NOTE_TEXT,
        textAlign: 'center',
        lineHeight: 20,
    },
    bodyTextContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    boldText: {
        fontFamily: FONTFAMILY.INTER_BOLD,
        fontWeight: '600',
        color: COLORS.BOTTOM_BLACK,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        backgroundColor: COLORS.THEME_GREEN,
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '600',
    },
});

