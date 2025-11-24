import { StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants/colors';

export default StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    iconContainer: {
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontFamily: FONTFAMILY.INTER_SEMIBOLD,
        fontWeight: '600',
        color: COLORS.BOTTOM_BLACK,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontWeight: '400',
        color: COLORS.BOTTOM_BLACK,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 8,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 8,
    },
    retryButton: {
        backgroundColor: COLORS.WHITE,
        borderWidth: 1,
        borderColor: COLORS.THEME_GREEN,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        minWidth: 100,
    },
    retryButtonText: {
        color: COLORS.THEME_GREEN,
        fontSize: 16,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
    },
});

