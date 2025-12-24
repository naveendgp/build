import { useMemo } from 'react';
import { OrderStatus, OrderStatusCode, OrderUpdateLog, VendorOrder, getOrderStatusMessage } from '../../../apiService/types/ordersTypes';
import SvgOrderAcceptedIcon from '../../../assets/auto-generated-svg-icons/ServicesIcon';
import SvgOrderDriverAcceptedIcon from '../../../assets/auto-generated-svg-icons/ServicesIcon';
import SvgMobileVerifiedIcon from '../../../assets/auto-generated-svg-icons/ServicesIcon';
import SvgListIcon from '../../../assets/auto-generated-svg-icons/ServicesIcon';


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
    [OrderStatus.ACCEPTED]: { icon: SvgOrderAcceptedIcon, iconType: 'svg' },
    [OrderStatus.DRIVER_ACCEPTED]: { icon: SvgOrderDriverAcceptedIcon, iconType: 'svg' },
    [OrderStatus.VERIFIED]: { icon: SvgMobileVerifiedIcon, iconType: 'svg' },
    [OrderStatus.PICKED_UP]: { icon: SvgListIcon, iconType: 'svg' },
};

const DEFAULT_ICON: IconConfig = { icon: SvgListIcon, iconType: 'svg' };

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
    orderData: VendorOrder
): TimelineEvent => {
    const date = new Date(log.timestamp);
    const iconConfig = getStatusIcon(log.status);

    console.log('log----------------------', log);
    console.log('orderData', orderData);

    return {
        id: `log-${index}`,
        time: formatTimeLabel(date),
        date: formatDateLabel(date),
        icon: iconConfig.icon,
        iconType: iconConfig.iconType,
        title: getOrderStatusMessage(log.status),
        showCallButton: log.status === OrderStatus.CALL_BUTTON_VISIBLE,
        showOtp: log.status === OrderStatus.OTP_VISIBLE,
        otp: orderData?.vendor_otp ? orderData.vendor_otp.toString() : undefined,
        riderName: orderData?.rider?.name,
        riderPhone: orderData?.rider?.phone,
    };
};

/**
 * Custom hook to transform order update logs into timeline events
 */
export const useOrderTimeline = (orderData: VendorOrder | undefined): TimelineEvent[] => {
    return useMemo(() => {
        if (!orderData?.updateLogs || orderData.updateLogs.length === 0) {
            return [];
        }

        return orderData.updateLogs.map((log, index) =>
            transformLogToEvent(log, index, orderData)
        );
    }, [orderData?.updateLogs, orderData?.vendor_otp, orderData?.rider]);
};

