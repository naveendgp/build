import { useMemo } from 'react';
import { Order, OrderUpdateLog, OrderStatus, getOrderStatusMessage } from '../../../../types/order/order';
import SvgRiderAcceptedIcon from '../../../assets/auto-generated-svg-icons/RiderAcceptedIcon';
import SvgOtpIconCopy from '../../../assets/assets/auto-generated-svg-icons/OtpIconCopy';


export interface TimelineEvent {
    id: string;
    time: string;
    date: string;
    icon: string | React.ComponentType;
    iconType: string;
    title: string;
    showCallButton: boolean;
    showOtp: boolean;
    otp?: string;
    riderName?: string;
    riderPhone?: string;
}

interface IconConfig {
    icon: string | React.ComponentType;
    iconType: string;
}

// Status to icon mapping
const STATUS_ICON_MAP: Record<number, IconConfig> = {
    [OrderStatus.DRIVER_ACCEPTED]: { icon: SvgRiderAcceptedIcon, iconType: 'svg' },
    [OrderStatus.VERIFIED]: { icon: SvgOtpIconCopy, iconType: 'svg' },
};

const DEFAULT_ICON: IconConfig = { icon: SvgRiderAcceptedIcon, iconType: 'svg' };

/**
 * Formats a date to a human-readable label
 */
const formatDateLabel = (date: Date): string => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';

    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
};

/**
 * Formats a date to a time string
 */
const formatTimeLabel = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

/**
 * Gets icon configuration for a given status
 */
const getStatusIcon = (status: number): IconConfig => {
    return STATUS_ICON_MAP[status] ||
        DEFAULT_ICON;
};

/**
 * Transforms an update log to a timeline event
 */
const transformLogToEvent = (
    log: OrderUpdateLog,
    index: number,
    orderData: Order
): TimelineEvent => {
    const date = new Date(log.timestamp);
    const iconConfig = getStatusIcon(log.status);

    return {
        id: `log-${index}`,
        time: formatTimeLabel(date),
        date: formatDateLabel(date),
        icon: iconConfig.icon,
        iconType: iconConfig.iconType,
        title: getOrderStatusMessage(log.status),
        showCallButton: log.status === OrderStatus.CALL_BUTTON_VISIBLE,
        showOtp: log.status === OrderStatus.OTP_VISIBLE,
        otp: orderData?.user_otp ? orderData.user_otp.toString() : undefined,
        riderName: orderData?.rider?.name,
        riderPhone: orderData?.rider?.phone,
    };
};

/**
 * Custom hook to transform order update logs into timeline events
 */
export const useOrderTimeline = (orderData: Order | null): TimelineEvent[] => {
    return useMemo(() => {
        if (!orderData?.updateLogs || orderData.updateLogs.length === 0) {
            return [];
        }

        return orderData.updateLogs.map((log, index) =>
            transformLogToEvent(log, index, orderData)
        );
    }, [orderData?.updateLogs, orderData?.user_otp, orderData?.rider]);
};

