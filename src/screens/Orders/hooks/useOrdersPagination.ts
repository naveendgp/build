import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { OrderStatus } from '../../../types/order/order';
import { OrderStatusCode, VendorOrder, OrdersResponse } from '../../../apiService/types/ordersTypes';
import { fetchOrdersByStatus } from '../../../apiService/api/ordersApi';

const statusToCodeMap: Record<OrderStatus, OrderStatusCode> = {
    [OrderStatus.RECEIVED]: OrderStatusCode.RECEIVED,
    [OrderStatus.ACCEPTED]: OrderStatusCode.ACCEPTED,
    [OrderStatus.READY_FOR_PICK_UP]: OrderStatusCode.READY_FOR_PICKUP,
    [OrderStatus.COMPLETED]: OrderStatusCode.COMPLETED,
};

export const ORDERS_QUERY_KEY = 'orders';

const DEFAULT_LIMIT = 10;

export const useOrdersPagination = (
    status: OrderStatus,
    enabled = true,
    limit = DEFAULT_LIMIT,
) => {
    const statusCode = statusToCodeMap[status];

    const query = useInfiniteQuery<OrdersResponse, Error, InfiniteData<OrdersResponse>, (string | number)[], number>({
        queryKey: [ORDERS_QUERY_KEY, statusCode, limit],
        queryFn: ({ pageParam = 1 }) =>
            fetchOrdersByStatus({
                status: statusCode,
                page: pageParam as number,
                limit,
            }),
        enabled,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const currentPage = parseInt(lastPage.data.page, 10);
            const totalPages = lastPage.data.totalPages;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        getPreviousPageParam: (firstPage) => {
            const currentPage = parseInt(firstPage.data.page, 10);
            return currentPage > 1 ? currentPage - 1 : undefined;
        },
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });

    // Flatten all pages into a single array with proper typing
    const allOrders: VendorOrder[] = query.data?.pages.flatMap((page) => page.data.orders) ?? [];

    // Get pagination info from first page
    const firstPage = query.data?.pages[0];
    const total = firstPage?.data.total ?? 0;
    const totalPages = firstPage?.data.totalPages ?? 0;
    const currentPage = firstPage ? parseInt(firstPage.data.page, 10) : 1;

    return {
        ...query,
        data: allOrders,
        total,
        totalPages,
        currentPage,
        hasNextPage: query.hasNextPage,
        hasPreviousPage: query.hasPreviousPage,
        loadMore: query.fetchNextPage,
        isFetchingMore: query.isFetchingNextPage,
    };
};

