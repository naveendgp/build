import { StyleSheet } from 'react-native';
import shared from '../../styles/shared';
import { COLORS, FONTFAMILY } from '../../constants/colors';

export default {
  ...shared,
  ...StyleSheet.create({
    connectorCompleted: {
      backgroundColor: '#026602',
      width: 2,
    },
    stepIndicatorRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: 16,

    },
    stepIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#ccc',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.BORDER_INPUT,
    },
    stepIndicatorActive: {
      borderColor: COLORS.STEP_INDICATOR_ACTIVE,
      backgroundColor: COLORS.ICON_GREEN,
      width: 24,
      height: 24,
      borderRadius: 20,
    },
    stepIndicatorCompleted: {
      borderColor: COLORS.STEP_INDICATOR_ACTIVE,
      backgroundColor: COLORS.ICON_GREEN,
      width: 24,
      height: 24,
      borderRadius: 20,
    },
    stepIndicatorText: {
      fontFamily: FONTFAMILY.INTER_SEMIBOLD,
      fontSize: 18, fontWeight: '700', color: COLORS.BLACK
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: COLORS.INPUT_TEXT,
    },
    activeDot: {
      backgroundColor: COLORS.THEME_GREEN,
    },
    connector: {
      height: 2,
      flex: 1,
      backgroundColor: '#BABABA',
      alignSelf: 'center',
      marginHorizontal: 8,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      marginBottom: 20,
    },
    previousButton: {
      flex: 1,
      backgroundColor: COLORS.CARD_BACKGROUND,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.GREEN,
    },
    previousButtonText: {
      color: '#666666',
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      fontWeight: '500',
    },
    nextButton: {
      flex: 1,
      backgroundColor: '#038203',
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
    },
    nextButtonFullWidth: {
      width: '100%',
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      fontWeight: '500',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  }),
};
