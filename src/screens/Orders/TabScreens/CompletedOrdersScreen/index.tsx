import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { View, RefreshControl, SectionList, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import CompletedOrderCard, { CompletedOrderCardProps } from '../../CardComponents/CompletedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';
import { OrderStatus } from '../../../../types/order/order';
import { VendorOrder } from '../../../../apiService/types/ordersTypes';
import { CompletedSection, mapOrdersToCompletedSections } from '../../utils/orderMappers';
import { useOrdersPagination } from '../../hooks/useOrdersPagination';
import { useOrdersCountStore } from '../../../../apiService/store/useOrdersCountStore';
import { COLORS, FONTFAMILY } from '../../../../constants/colors';
import ErrorScreen from '../../../../components/ErrorScreen';
import EmptyScreen from '../../../../components/EmptyScreen';
import LoadingScreen from '../../../../components/LoadingScreen';

type CompletedOrdersNavProp = NativeStackNavigationProp<RootStackParamList>;

interface CompletedOrdersScreenProps {
  tabType: OrderStatus;
}

const CompletedOrdersScreen: React.FC<CompletedOrdersScreenProps> = ({
  tabType,
}) => {
  const navigation = useNavigation<CompletedOrdersNavProp>();

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

  useEffect(() => {
    setCount(tabType, computedCount);
  }, [computedCount, tabType, setCount]);

  const groupedData = useMemo<CompletedSection[]>(
    () => mapOrdersToCompletedSections(orders),
    [orders],
  );

  const handleNavigateToDetails = useCallback(
    (order: VendorOrder) => {
      navigation.navigate('OrderDetails', {
        orderId: order._id,
      });
    },
    [navigation],
  );

  const renderOrderItem = useCallback(
    ({ item }: { item: CompletedSection['data'][number] }) => (
      <CompletedOrderCard
        {...item.card}
        onViewDetails={() => handleNavigateToDetails(item.source)}
      />
    ),
    [handleNavigateToDetails],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: CompletedSection }) => (
      <View style={styles.sectionHeader}>
        <CustomText style={styles.sectionHeaderText}>{section.title}</CustomText>
      </View>
    ),
    [],
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {
        isLoading ? (
          <LoadingScreen />
        ) :
          isError ? (
            <ErrorScreen onRetry={() => refetch()} />
          ) : (
            <EmptyScreen title="No completed orders" />
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
      <SectionList
        sections={groupedData}
        renderItem={renderOrderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.card.orderId}
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
        stickySectionHeadersEnabled={false}
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

export default CompletedOrdersScreen;

