import { useMemo } from "react";
import { Order, OrderStatusTimestamps } from "../../../../types/order/order";

export type TimelineEntry = {
    status: string;
    date: string;
    time: string;
    isCompleted?: boolean;
};

// Format status label from timestamp key
const formatStatusLabel = (statusKey: string): string => {
    const statusMap: Record<string, string> = {
        accepted_at: "Order Accepted",
        picked_up_at: "Clothes Picked up",
        in_progress_at: "Order In Progress",
        ready_at: "Order Ready",
        out_for_delivery_at: "Out for Delivery",
        delivered_at: "Clothes Delivered",
        cancelled_at: "Order Cancelled",
        unaccepted_at: "Order Unaccepted",
    };
    return statusMap[statusKey] || statusKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Format date
const formatDate = (timestamp: string | undefined): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    });
};

// Format time
const formatTime = (timestamp: string | undefined): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

// Build timeline from order status_timestamps
const buildTimeline = (order: Order | undefined): TimelineEntry[] => {
    if (!order) {
        return [];
    }

    const entries: TimelineEntry[] = [];
    const timestamps = order.status_timestamps || {};

    // Map timestamp keys to their order of occurrence
    const timestampOrder = [
        "accepted_at",
        "picked_up_at",
        "in_progress_at",
        "ready_at",
        "out_for_delivery_at",
        "delivered_at",
    ];

    timestampOrder.forEach((key) => {
        const timestamp = timestamps[key as keyof OrderStatusTimestamps];
        if (timestamp) {
            entries.push({
                status: formatStatusLabel(key),
                date: formatDate(timestamp),
                time: formatTime(timestamp),
                isCompleted: true,
            });
        }
    });

    // Handle cancelled and unaccepted
    if (timestamps.cancelled_at) {
        entries.push({
            status: formatStatusLabel("cancelled_at"),
            date: formatDate(timestamps.cancelled_at),
            time: formatTime(timestamps.cancelled_at),
            isCompleted: true,
        });
    }

    if (timestamps.unaccepted_at) {
        entries.push({
            status: formatStatusLabel("unaccepted_at"),
            date: formatDate(timestamps.unaccepted_at),
            time: formatTime(timestamps.unaccepted_at),
            isCompleted: true,
        });
    }

    // If no entries, add order created
    if (entries.length === 0) {
        entries.push({
            status: "Order Created",
            date: formatDate(order.created_at),
            time: formatTime(order.created_at),
            isCompleted: order.status === "delivered",
        });
    }

    return entries;
};

/**
 * Custom hook to build timeline from order status_timestamps
 * @param order - Order object containing status_timestamps
 * @returns Array of timeline entries with status, date, time, and completion status
 */
export const useOrderCardTimeline = (order: Order | undefined): TimelineEntry[] => {
    return useMemo(() => {
        return buildTimeline(order);
    }, [order?.status_timestamps, order?.status, order?.created_at]);
};

