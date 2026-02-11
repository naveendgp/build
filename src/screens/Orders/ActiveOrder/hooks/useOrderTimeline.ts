import { useMemo } from 'react';
import { Order, OrderUpdateLog, OrderStatus, getOrderStatusMessage } from '../../../../types/order/order';
import SvgOrderAcceptedIcon from '../../../../assets/auto-generated-svg-icons/OrderAcceptedIcon';
import SvgOrderList from '../../../../assets/auto-generated-svg-icons/OrderList';
import SvgOrderOutDelivery from '../../../../assets/auto-generated-svg-icons/OrderOutDelivery';
import SvgOrderPhone from '../../../../assets/auto-generated-svg-icons/OrderPhone';
import SvgOrderProcessed from '../../../../assets/auto-generated-svg-icons/OrderProcessed';
import SvgOrderRider from '../../../../assets/auto-generated-svg-icons/OrderRider';

export interface TimelineEvent {
    id: string;
    time: string | null;
    date: string | null;
    icon: string | React.ComponentType;
    iconType: string;
    title: string;
    showCallButton: boolean;
    showOtp: boolean;
    otp?: string;
    riderName?: string;
    riderPhone?: string;
    status?: number;
}

interface IconConfig {
    icon: string | React.ComponentType;
    iconType: string;
}

// Status to icon mapping - matching TimeLineCard icons
const STATUS_ICON_MAP: Record<number, IconConfig> = {
    [OrderStatus.CREATED]: { icon: SvgOrderAcceptedIcon, iconType: 'svg' },
    [OrderStatus.ACCEPTED]: { icon: SvgOrderAcceptedIcon, iconType: 'svg' },
    [OrderStatus.DRIVER_ACCEPTED]: { icon: SvgOrderRider, iconType: 'svg' },
    [OrderStatus.PICKED_UP]: { icon: SvgOrderList, iconType: 'svg' },
    [OrderStatus.OUT_FOR_DELIVERY]: { icon: SvgOrderOutDelivery, iconType: 'svg' },
    [OrderStatus.PROCESSED]: { icon: SvgOrderProcessed, iconType: 'svg' },
    [OrderStatus.PROCESSING]: { icon: SvgOrderProcessed, iconType: 'svg' },
    [OrderStatus.RIDER_PENDING]: { icon: SvgOrderPhone, iconType: 'svg' },
    [OrderStatus.CALL_BUTTON_VISIBLE]: { icon: SvgOrderRider, iconType: 'svg' },
};

const DEFAULT_ICON: IconConfig = { icon: SvgOrderList, iconType: 'svg' };

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
    const iconConfig = getStatusIcon(log.status);

    // Handle null timestamp
    let time: string | null = null;
    let date: string | null = null;

    if (log.timestamp) {
        const dateObj = new Date(log.timestamp);
        time = formatTimeLabel(dateObj);
        date = formatDateLabel(dateObj);
    }

    return {
        id: `log-${index}`,
        time,
        date,
        icon: iconConfig.icon,
        iconType: iconConfig.iconType,
        title: getOrderStatusMessage(log.status),
        showCallButton: log.status === OrderStatus.CALL_BUTTON_VISIBLE,
        showOtp: log.status === OrderStatus.OTP_VISIBLE,
        otp: orderData?.user_otp ? orderData.user_otp.toString() : undefined,
        riderName: orderData?.rider?.name,
        riderPhone: orderData?.rider?.phone,
        status: log.status, // Add status for TimeLineCard to use
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

