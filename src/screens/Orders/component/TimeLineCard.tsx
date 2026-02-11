import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from '../../../components/Text';
import CustomIcon from '../../../components/Icon';
import { COLORS } from '../../../constants/colors';
import { FONTFAMILY } from '../../../constants/fonts';
import SvgPhoneIcon from '../../../assets/auto-generated-svg-icons/PhoneIcon';
// Import icons for status mapping
import SvgOrderAcceptedIcon from '../../../assets/auto-generated-svg-icons/OrderAcceptedIco';
import SvgOrderList from '../../../assets/auto-generated-svg-icons/OrderList';
import SvgOrderOutDelivery from '../../../assets/auto-generated-svg-icons/OrderOutDelivery';
import SvgOrderPhone from '../../../assets/auto-generated-svg-icons/OrderPhone';
import SvgOrderProcessed from '../../../assets/auto-generated-svg-icons/OrderProcessed';
import SvgOrderRider from '../../../assets/auto-generated-svg-icons/OrderRider';
import { OrderStatus } from '../../../types/order/order';

interface TimeLineCardProps {
    date: string | null;
    time: string | null;
    title: string;
    icon: string | React.ComponentType;
    iconType?: string;
    status?: string | number; // Status to determine icon (can be string or number)
    note?: string;
    showCallButton?: boolean;
    onCallPress?: (phone: string) => void;
    otp?: string;
    riderName?: string;
    riderPhone?: string;
    showTimelineLine?: boolean;
}

// Status to icon mapping - matching useOrderTimeline mapping
const getStatusIcon = (status: string | number | undefined): { icon: string | React.ComponentType; iconType: string } => {
    if (status === undefined || status === null) {
        return { icon: SvgOrderList, iconType: 'svg' }; // Default to SVG component
    }

    // Convert status to number
    const statusNumber = typeof status === 'string' ? parseInt(status, 10) : status;

    // Check if conversion resulted in a valid number
    if (isNaN(statusNumber)) {
        return { icon: SvgOrderList, iconType: 'svg' }; // Default to SVG component
    }

    // Map status numbers to icons - matching OrderStatus enum and useOrderTimeline mapping
    const statusIconMap: Record<number, { icon: string | React.ComponentType; iconType: string }> = {
        [OrderStatus.CREATED]: { icon: SvgOrderAcceptedIcon, iconType: 'svg' },
        [OrderStatus.ACCEPTED]: { icon: SvgOrderAcceptedIcon, iconType: 'svg' },//
        [OrderStatus.DRIVER_ACCEPTED]: { icon: SvgOrderRider, iconType: 'svg' },
        [OrderStatus.PICKED_UP]: { icon: SvgOrderList, iconType: 'svg' },
        [OrderStatus.OUT_FOR_DELIVERY]: { icon: SvgOrderOutDelivery, iconType: 'svg' },
        [OrderStatus.PROCESSED]: { icon: SvgOrderOutDelivery, iconType: 'svg' },
        [OrderStatus.PROCESSING]: { icon: SvgOrderProcessed, iconType: 'svg' },
        [OrderStatus.RIDER_PENDING]: { icon: SvgOrderRider, iconType: 'svg' },
        [OrderStatus.CALL_BUTTON_VISIBLE]: { icon: SvgOrderRider, iconType: 'svg' },
        [OrderStatus.OTP_VISIBLE]: { icon: SvgOrderPhone, iconType: 'svg' },
        [OrderStatus.VENDOR_PENDING]: { icon: SvgOrderAcceptedIcon, iconType: 'svg' },//

    };

    // Check if we have a custom mapping
    if (statusIconMap[statusNumber]) {
        return statusIconMap[statusNumber];
    }

    // Fallback to default SVG icon
    return { icon: SvgOrderList, iconType: 'svg' };
};

const TimeLineCard: React.FC<TimeLineCardProps> = ({
    date,
    time,
    title,
    icon,
    iconType = 'MaterialCommunityIcons',
    status,
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


    // Prioritize status-based icon mapping if status is provided, otherwise use passed icon
    const iconConfig = status ? getStatusIcon(status) : { icon, iconType };
    const displayIcon = iconConfig.icon;
    const displayIconType = iconConfig.iconType;


    // Render icon - SVG components directly like <SvgOrderProcessed />, others via CustomIcon
    const renderIcon = () => {
        // If icon is a React component (not a string), render it directly
        if (typeof displayIcon !== 'string') {
            const SvgIcon = displayIcon as React.ComponentType<{ width?: number; height?: number }>;
            return <SvgIcon />;
        }
        // Otherwise use CustomIcon for string-based icon names
        return (
            <CustomIcon
                type={displayIconType as any}
                name={displayIcon as string}
                size={24}
                color={COLORS.INPUT_TEXT}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* Timestamp - Only show if both date and time exist */}
            {date && time && (
                <CustomText style={styles.timestamp}>
                    {date} - {time}
                </CustomText>
            )}

            {/* Event Card */}
            <View style={styles.eventCard}>
                {/* Icon Container */}

                {renderIcon()}


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
            {note && (
                <CustomText style={styles.noteText}>{note}</CustomText>
            )}

            {/* Timeline Line */}
            {showTimelineLine && <View style={styles.timelineLine} />}
        </View>
    );
};

export default TimeLineCard;

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
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
        marginLeft: 8
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
        alignItems: 'center',
        borderColor: COLORS.ACCENT,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    callButtonText: {
        color: COLORS.ACCENT,
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

