import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from '../../../components/Text';
import CustomIcon from '../../../components/Icon';
import { COLORS } from '../../../constants/colors';
import { FONTFAMILY } from '../../../constants/fonts';
import SvgPhoneIcon from '../../../assets/auto-generated-svg-icons/PhoneIcon';

interface TimeLineCardProps {
    date: string;
    time: string;
    title: string;
    icon: string | React.ComponentType;
    iconType?: string;
    note?: string;
    showCallButton?: boolean;

    onCallPress?: (phone: string) => void;
    otp?: string;
    riderName?: string;
    riderPhone?: string;
    showTimelineLine?: boolean;
}

const TimeLineCard: React.FC<TimeLineCardProps> = ({
    date,
    time,
    title,
    icon,
    iconType = 'MaterialCommunityIcons',
    note,
    showCallButton = false,

    onCallPress,
    otp,
    showTimelineLine = false,
    riderName,
    riderPhone,
}) => {
    const handleCall = () => {
        if (riderPhone && onCallPress) {
            onCallPress(riderPhone);
        }
    };

    return (
        <View style={styles.container}>
            {/* Timestamp */}
            {(date || time) && (
                <CustomText style={styles.timestamp}>
                    {date}{date && time ? ' - ' : ''}{time}
                </CustomText>
            )}

            {/* Event Card */}
            <View style={styles.eventCard}>
                {/* Icon Container */}
                <View style={styles.iconContainer}>
                    <CustomIcon
                        type={iconType as any}
                        name={icon as string}
                        size={24}
                        color={COLORS.INPUT_TEXT}
                    />
                </View>

                {/* Event Description */}
                <View style={styles.eventContent}>
                    <CustomText style={styles.eventTitle}>
                        {
                            showCallButton ? riderName + title : title
                        }

                    </CustomText>

                    {otp && <CustomText style={styles.eventTitle}>
                        {
                            otp
                        }

                    </CustomText>}

                    {/* Call Button */}
                    {showCallButton && (
                        <TouchableOpacity style={styles.callButton} onPress={handleCall}>

                            <SvgPhoneIcon />
                            <CustomText style={styles.callButtonText}>
                                Call Rider
                            </CustomText>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Note */}
            {/* {note && (
                <CustomText style={styles.noteText}>{note}</CustomText>
            )} */}

            {/* Timeline Line
            {showTimelineLine && <View style={styles.timelineLine} />} */}
        </View>
    );
};

export default TimeLineCard;

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        marginTop: 16
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.NOTE_TEXT,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        marginBottom: 6,
        fontWeight: '400',
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_INPUT,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.BORDER_INPUT,

        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    eventContent: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        color: COLORS.INPUT_TEXT,
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontWeight: '500',
        lineHeight: 20,
    },
    otpText: {
        fontSize: 16,
        color: COLORS.BLACK,
        fontFamily: FONTFAMILY.INTER_BOLD,
        fontWeight: '700',
    },
    callButton: {
        flexDirection: 'row',
        borderColor: COLORS.THEME_GREEN,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 8,
        width: "100%",
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    callButtonText: {
        color: COLORS.THEME_GREEN,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    noteText: {
        fontSize: 14,
        color: COLORS.NOTE_TEXT,
        fontFamily: FONTFAMILY.INTER_REGULAR,
        marginTop: 6,
        fontWeight: '400',

    },
    timelineLine: {
        width: 2,
        height: 45,
        backgroundColor: COLORS.DASHED_BORDER,
        marginTop: 8,
        marginLeft: 40,
        opacity: 0.5,
    },
});

