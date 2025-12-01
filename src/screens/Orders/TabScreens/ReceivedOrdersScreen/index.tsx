import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import ReceivedOrderCard from '../../CardComponents/RecivedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';
import socket from '../../../../apiService/socket/socket';
import { useFocusEffect } from '@react-navigation/native';
import { SOCKET_ENDPOINTS } from '../../../../constants';
import { OrderStatus } from '../../../../types/order/order';
import { mapOrdersToReceivedCards } from '../../utils/orderMappers';
import { useOrdersPagination } from '../../hooks/useOrdersPagination';
import { useOrdersCountStore } from '../../../../apiService/store/useOrdersCountStore';
import { COLORS, FONTFAMILY } from '../../../../constants/colors';
import ErrorScreen from '../../../../components/ErrorScreen';
import EmptyScreen from '../../../../components/EmptyScreen';
import LoadingScreen from '../../../../components/LoadingScreen';

interface ReceivedOrdersScreenProps {
  tabType: OrderStatus;
}

const ReceivedOrdersScreen: React.FC<ReceivedOrdersScreenProps> = ({
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
  const [expiredOrderIds, setExpiredOrderIds] = useState<Set<string>>(new Set());
  const previousOrderIdsRef = useRef<string>('');
  const displayOrderSequenceRef = useRef<string[]>([]); // Track the order of displayed items

  const allDisplayOrders = useMemo(
    () => mapOrdersToReceivedCards(orders),
    [orders],
  );

  // Maintain order: existing items stay in their positions, new items go to the end
  const displayOrders = useMemo(() => {
    const filteredOrders = allDisplayOrders.filter(order => !expiredOrderIds.has(order.orderId));

    // If no orders, reset the sequence
    if (filteredOrders.length === 0) {
      displayOrderSequenceRef.current = [];
      return [];
    }

    // Create a map for quick lookup
    const orderMap = new Map(filteredOrders.map(order => [order.orderId, order]));

    // Get current order IDs from the filtered orders
    const currentOrderIds = filteredOrders.map(order => order.orderId);

    // If sequence is empty or completely different, initialize with current order
    if (displayOrderSequenceRef.current.length === 0 ||
      displayOrderSequenceRef.current.every(id => !orderMap.has(id))) {
      displayOrderSequenceRef.current = currentOrderIds;
      return filteredOrders;
    }

    // Preserve existing order sequence
    const existingOrderIds = displayOrderSequenceRef.current.filter(id => orderMap.has(id));

    // Find new order IDs (not in the existing sequence)
    const newOrderIds = currentOrderIds.filter(id => !displayOrderSequenceRef.current.includes(id));

    // Combine: existing orders in their original order, then new orders
    const orderedIds = [...existingOrderIds, ...newOrderIds];

    // Update the ref with the new sequence
    displayOrderSequenceRef.current = orderedIds;

    // Return orders in the preserved order
    return orderedIds
      .map(id => orderMap.get(id))
      .filter((order): order is ReturnType<typeof mapOrdersToReceivedCards>[number] => order !== undefined);
  }, [allDisplayOrders, expiredOrderIds]);

  // Compute count based on displayed orders (excluding expired ones)
  const computedCount = useMemo(() => {
    // Use displayOrders.length to account for expired orders that have been removed
    return displayOrders.length;
  }, [displayOrders.length]);

  // Update store whenever count changes (even if value stays same)
  useEffect(() => {
    setCount(tabType, computedCount);
  }, [computedCount, tabType, setCount]);

  // Clear expired orders when orders are refetched (only when order IDs actually change)
  useEffect(() => {
    if (!isRefetching && orders) {
      const currentOrderIds = new Set(
        mapOrdersToReceivedCards(orders).map(order => order.orderId)
      );
      const currentOrderIdsString = Array.from(currentOrderIds).sort().join(',');

      // Only update if order IDs have actually changed
      if (currentOrderIdsString !== previousOrderIdsRef.current) {
        previousOrderIdsRef.current = currentOrderIdsString;
        setExpiredOrderIds(prev => {
          const filtered = new Set<string>();
          prev.forEach(id => {
            if (currentOrderIds.has(id)) {
              filtered.add(id);
            }
          });
          return filtered;
        });
      }
    }
  }, [orders, isRefetching]);

  useEffect(() => {
    console.log("[Screen] useEffect triggered");

    // 1. Ensure socket physically connects first
    socket.connect();

    // 2. Register event listener ONLY AFTER connection
    const handleData = (data: any) => {
      console.log('🔥 EVENT RECEIVED:', data);
      refetch();
    };

    socket.on(SOCKET_ENDPOINTS.VENDOR_ORDER, handleData);
    console.log("[Screen] Listener attached");

    return () => {
      socket.off(SOCKET_ENDPOINTS.VENDOR_ORDER, handleData);
    };
  }, []);






  const handleOrderAccept = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleOrderExpire = useCallback((orderId: string) => {
    setExpiredOrderIds(prev => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
  }, []);

  const renderOrderItem = useCallback(
    ({ item, index }: { item: ReturnType<typeof mapOrdersToReceivedCards>[number]; index: number }) => (
      <ReceivedOrderCard
        {...item}
        tabType={tabType}
        index={index}
        onAccept={handleOrderAccept}
        onExpire={() => handleOrderExpire(item.orderId)}
      />
    ),
    [tabType, handleOrderAccept, handleOrderExpire],
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
    if (!hasNextPage) {
      return <View style={{ height: 24 }} />;
    }

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

  // if (isLoading) {
  //   return (
  //     <View style={styles.fullScreenLoader}>
  //       <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
  //     </View>
  //   );
  // }

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

export default ReceivedOrdersScreen;

