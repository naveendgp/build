import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderStatus } from '../../../types/order/order';
import { OrderStatusCode } from '../../../apiService/types/ordersTypes';
import { fetchOrdersByStatus } from '../../../apiService/api/ordersApi';

const statusToCodeMap: Record<OrderStatus, OrderStatusCode> = {
    [OrderStatus.RECEIVED]: OrderStatusCode.RECEIVED,
    [OrderStatus.ACCEPTED]: OrderStatusCode.ACCEPTED,
    [OrderStatus.READY_FOR_PICK_UP]: OrderStatusCode.READY_FOR_PICKUP,
    [OrderStatus.COMPLETED]: OrderStatusCode.COMPLETED,
};

export const ORDERS_QUERY_KEY = 'orders';

export const useOrdersQuery = (
    status: OrderStatus,
    enabled = true,
) => {
    const statusCode = statusToCodeMap[status];

    const query = useQuery({
        queryKey: [ORDERS_QUERY_KEY, statusCode],
        queryFn: () => fetchOrdersByStatus(statusCode),
        enabled,
        select: data => data.data.orders,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });

    return query;
};

export const useOrdersPrefetch = () => {
    const queryClient = useQueryClient();

    const prefetch = (status: OrderStatus) => {
        const statusCode = statusToCodeMap[status];
        return queryClient.prefetchQuery({
            queryKey: [ORDERS_QUERY_KEY, statusCode],
            queryFn: () => fetchOrdersByStatus(statusCode),
            staleTime: 60 * 1000,
        });
    };

    return useMemo(() => ({ prefetch }), [queryClient]);
};


