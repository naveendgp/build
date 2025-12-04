import { useEffect, useRef } from 'react';
import { OrderStatus } from '../../../types/order/order';
import { useOrdersPagination } from './useOrdersPagination';
import { useOrdersCountStore } from '../../../apiService/store/useOrdersCountStore';

/**
 * Hook to initialize all order counts when the Orders screen first mounts
 * This ensures all tab badges show correct counts even if the user hasn't visited those tabs
 */
export const useInitializeOrderCounts = () => {
    const setCount = useOrdersCountStore(state => state.setCount);
    const previousTotalsRef = useRef<Record<OrderStatus, number | undefined>>({
        [OrderStatus.RECEIVED]: undefined,
        [OrderStatus.ACCEPTED]: undefined,
        [OrderStatus.READY_FOR_PICK_UP]: undefined,
        [OrderStatus.COMPLETED]: undefined,
    });

    // Fetch orders for all statuses to initialize counts
    const receivedOrders = useOrdersPagination(OrderStatus.RECEIVED, true, 1);
    const acceptedOrders = useOrdersPagination(OrderStatus.ACCEPTED, true, 1);
    const readyForPickupOrders = useOrdersPagination(OrderStatus.READY_FOR_PICK_UP, true, 1);
    const completedOrders = useOrdersPagination(OrderStatus.COMPLETED, true, 1);

    // Update counts when data is available (only when total actually changes)
    useEffect(() => {
        const currentTotal = receivedOrders.total;
        const previousTotal = previousTotalsRef.current[OrderStatus.RECEIVED];

        if (currentTotal !== undefined && currentTotal !== previousTotal) {
            setCount(OrderStatus.RECEIVED, currentTotal);
            previousTotalsRef.current[OrderStatus.RECEIVED] = currentTotal;
        } else if (currentTotal === undefined && receivedOrders.data?.length !== undefined && previousTotal === undefined) {
            // Fallback to data length only if total is not available and we haven't set it before
            const count = receivedOrders.data.length;
            setCount(OrderStatus.RECEIVED, count);
            previousTotalsRef.current[OrderStatus.RECEIVED] = count;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receivedOrders.total, receivedOrders.data?.length]);

    useEffect(() => {
        const currentTotal = acceptedOrders.total;
        const previousTotal = previousTotalsRef.current[OrderStatus.ACCEPTED];

        if (currentTotal !== undefined && currentTotal !== previousTotal) {
            setCount(OrderStatus.ACCEPTED, currentTotal);
            previousTotalsRef.current[OrderStatus.ACCEPTED] = currentTotal;
        } else if (currentTotal === undefined && acceptedOrders.data?.length !== undefined && previousTotal === undefined) {
            const count = acceptedOrders.data.length;
            setCount(OrderStatus.ACCEPTED, count);
            previousTotalsRef.current[OrderStatus.ACCEPTED] = count;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acceptedOrders.total, acceptedOrders.data?.length]);

    useEffect(() => {
        const currentTotal = readyForPickupOrders.total;
        const previousTotal = previousTotalsRef.current[OrderStatus.READY_FOR_PICK_UP];

        if (currentTotal !== undefined && currentTotal !== previousTotal) {
            setCount(OrderStatus.READY_FOR_PICK_UP, currentTotal);
            previousTotalsRef.current[OrderStatus.READY_FOR_PICK_UP] = currentTotal;
        } else if (currentTotal === undefined && readyForPickupOrders.data?.length !== undefined && previousTotal === undefined) {
            const count = readyForPickupOrders.data.length;
            setCount(OrderStatus.READY_FOR_PICK_UP, count);
            previousTotalsRef.current[OrderStatus.READY_FOR_PICK_UP] = count;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [readyForPickupOrders.total, readyForPickupOrders.data?.length]);

    useEffect(() => {
        const currentTotal = completedOrders.total;
        const previousTotal = previousTotalsRef.current[OrderStatus.COMPLETED];

        if (currentTotal !== undefined && currentTotal !== previousTotal) {
            setCount(OrderStatus.COMPLETED, currentTotal);
            previousTotalsRef.current[OrderStatus.COMPLETED] = currentTotal;
        } else if (currentTotal === undefined && completedOrders.data?.length !== undefined && previousTotal === undefined) {
            const count = completedOrders.data.length;
            setCount(OrderStatus.COMPLETED, count);
            previousTotalsRef.current[OrderStatus.COMPLETED] = count;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [completedOrders.total, completedOrders.data?.length]);
};

