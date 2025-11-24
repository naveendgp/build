import React, { useEffect, useMemo, useCallback, useState } from 'react';
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

  // Update store when total changes
  useEffect(() => {
    if (total > 0) {
      setCount(tabType, total);
    }
  }, [total, tabType, setCount]);

  const displayOrders = useMemo(
    () => mapOrdersToReceivedCards(orders),
    [orders],
  );

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
      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : isError ? (
        <CustomText style={styles.emptyText}>
          Error: {error?.message || 'Failed to load orders'}
        </CustomText>
      ) : (
        <CustomText style={styles.emptyText}>{getEmptyText()}</CustomText>
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

