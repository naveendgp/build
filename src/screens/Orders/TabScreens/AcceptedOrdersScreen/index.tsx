import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import ReceivedOrderCard from '../../CardComponents/RecivedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';
import { OrderStatus } from '../../../../types/order/order';
import { mapOrdersToReceivedCards } from '../../utils/orderMappers';
import { useOrdersPagination, ORDERS_QUERY_KEY } from '../../hooks/useOrdersPagination';
import { useOrdersCountStore } from '../../../../apiService/store/useOrdersCountStore';
import { COLORS, FONTFAMILY } from '../../../../constants/colors';
import EmptyScreen from '../../../../components/EmptyScreen';
import LoadingScreen from '../../../../components/LoadingScreen';
import ErrorScreen from '../../../../components/ErrorScreen';
import { OrderStatusCode } from '../../../../apiService/types/ordersTypes';

interface AcceptedOrdersScreenProps {
  tabType: OrderStatus;
}

const AcceptedOrdersScreen: React.FC<AcceptedOrdersScreenProps> = ({
  tabType,
}) => {
  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    hasNextPage,
    loadMore,
    isFetchingMore,
    total,
  } = useOrdersPagination(tabType, true, 5);

  const setCount = useOrdersCountStore(state => state.setCount);

  const computedCount = useMemo(() => {
    if (typeof total === 'number' && !Number.isNaN(total)) {
      return total;
    }
    if (Array.isArray(orders)) {
      return orders.length;
    }
    return 0;
  }, [total, orders]);

  // Update store whenever count changes
  useEffect(() => {
    setCount(tabType, computedCount);
  }, [computedCount, tabType, setCount]);

  const displayOrders = useMemo(
    () => mapOrdersToReceivedCards(orders),
    [orders],
  );

  const queryClient = useQueryClient();

  const handleOrderAccept = useCallback(() => {
    // Refetch current tab's data
    refetch();

    // Invalidate queries for COMPLETED and READY_FOR_PICKUP tabs
    // This ensures when an order moves from ACCEPTED -> READY_FOR_PICKUP/COMPLETED,
    // all related lists update properly
    queryClient.invalidateQueries({
      queryKey: [ORDERS_QUERY_KEY, OrderStatusCode.COMPLETED]
    });
    queryClient.invalidateQueries({
      queryKey: [ORDERS_QUERY_KEY, OrderStatusCode.READY_FOR_PICKUP]
    });
  }, [refetch, queryClient]);

  const renderOrderItem = useCallback(
    ({ item, index }: { item: ReturnType<typeof mapOrdersToReceivedCards>[number]; index: number }) => (
      <ReceivedOrderCard {...item} tabType={tabType} index={index} onAccept={handleOrderAccept} />
    ),
    [tabType, handleOrderAccept],
  );

  const keyExtractor = useCallback(
    (item: ReturnType<typeof mapOrdersToReceivedCards>[number]) => item.orderId,
    [],
  );

  const getEmptyText = () => {
    switch (tabType) {
      case OrderStatus.RECEIVED:
        return 'No received orders';
      case OrderStatus.ACCEPTED:
        return 'No accepted orders';
      case OrderStatus.READY_FOR_PICK_UP:
        return 'No orders ready for pickup';
      case OrderStatus.COMPLETED:
        return 'No completed orders';
      default:
        return 'No orders';
    }
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {
        isLoading ? (
          <LoadingScreen />
        ) :
          isError ? (
            <ErrorScreen onRetry={() => refetch()} />
          ) : (
            <EmptyScreen title={getEmptyText()} />
          )}
    </View>
  );

  const [footerLoading, setFooterLoading] = useState(false);

  useEffect(() => {
    if (!isFetchingMore) {
      setFooterLoading(false);
    }
  }, [isFetchingMore]);

  const renderFooter = () => {
    if (!hasNextPage) return <View style={{ height: 24 }} />;

    const showSpinner = isFetchingMore || footerLoading;

    return (
      <View
        style={{
          paddingVertical: 20,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 60,
        }}
      >
        {showSpinner ? (
          <>
            <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
            <CustomText
              style={{
                marginTop: 8,
                fontSize: 14,
                color: COLORS.TEXT_GRAY,
                fontFamily: FONTFAMILY.INTER_REGULAR,
              }}
            >
              Loading more orders...
            </CustomText>
          </>
        ) : (
          <CustomText
            style={{
              fontSize: 13,
              color: COLORS.TEXT_GRAY,
              fontFamily: FONTFAMILY.INTER_REGULAR,
            }}
          >
            Pull up to load more
          </CustomText>
        )}
      </View>
    );
  };

  const triggerLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingMore && !isLoading) {
      if (!footerLoading) {
        setFooterLoading(true);
      }
      loadMore();
    }
  }, [hasNextPage, isFetchingMore, isLoading, footerLoading, loadMore]);

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isNearBottom) {
      triggerLoadMore();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={displayOrders}
        renderItem={renderOrderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 10 }, // Extra padding to show loader above bottom tab
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        onMomentumScrollEnd={triggerLoadMore}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
          />
        }
      />
    </View>
  );
};

export default AcceptedOrdersScreen;

