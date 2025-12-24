import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { VendorReviewsResponse, Review } from '../../../../apiService/types/profileTypes';
import { getVendorReviews } from '../../../../apiService/api/profileApi';

export const VENDOR_REVIEWS_QUERY_KEY = 'vendor-reviews';

const DEFAULT_LIMIT = 10;

export const useVendorReviewsPagination = (
    enabled = true,
    limit = DEFAULT_LIMIT,
) => {
    const query = useInfiniteQuery<
        VendorReviewsResponse,
        Error,
        InfiniteData<VendorReviewsResponse>,
        (string | number)[],
        number
    >({
        queryKey: [VENDOR_REVIEWS_QUERY_KEY, limit],
        queryFn: ({ pageParam = 1 }) =>
            getVendorReviews({
                limit,
                page: pageParam as number,
            }),
        enabled,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (!lastPage.status || !lastPage.data) {
                return undefined;
            }
            const currentPage = lastPage.data.page;
            const totalPages = lastPage.data.totalPages;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        getPreviousPageParam: (firstPage) => {
            if (!firstPage.status || !firstPage.data) {
                return undefined;
            }
            const currentPage = firstPage.data.page;
            return currentPage > 1 ? currentPage - 1 : undefined;
        },
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });

    // Flatten all pages into a single array with proper typing
    const allReviews: Review[] = query.data?.pages.flatMap((page) => page.data.reviews) ?? [];

    // Get pagination info from first page
    const firstPage = query.data?.pages[0];
    const total = firstPage?.data.total ?? 0;
    const totalPages = firstPage?.data.totalPages ?? 0;
    const currentPage = firstPage?.data.page ?? 1;

    const averageReviews = firstPage?.data.average_reviews ?? 0;
    const reviewsCount = firstPage?.data.reviews_count ?? 0;

    return {
        ...query,
        data: allReviews,
        total,
        totalPages,
        currentPage,
        hasNextPage: query.hasNextPage,
        hasPreviousPage: query.hasPreviousPage,
        loadMore: query.fetchNextPage,
        isFetchingMore: query.isFetchingNextPage,
        averageReviews,
        reviewsCount,
    };
};

