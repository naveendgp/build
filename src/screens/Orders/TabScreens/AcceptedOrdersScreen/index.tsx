import React, { useMemo, useCallback } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import ReceivedOrderCard from '../../CardComponents/RecivedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';
import { OrderStatus } from '../../../../types/order/order';
import { VendorOrder } from '../../../../apiService/types/ordersTypes';
import { mapOrdersToReceivedCards } from '../../utils/orderMappers';

interface AcceptedOrdersScreenProps {
  tabType: OrderStatus;
  orders?: VendorOrder[];
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
}

const AcceptedOrdersScreen: React.FC<AcceptedOrdersScreenProps> = ({
  tabType,
  orders,
  onRefresh,
  refreshing = false,
  loading = false,
}) => {
  const displayOrders = useMemo(
    () => mapOrdersToReceivedCards(orders),
    [orders],
  );

  const renderOrderItem = useCallback(
    ({ item, index }: { item: ReturnType<typeof mapOrdersToReceivedCards>[number]; index: number }) => (
      <ReceivedOrderCard {...item} tabType={tabType} index={index} />
    ),
    [tabType],
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
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <CustomText style={styles.emptyText}>{getEmptyText()}</CustomText>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={displayOrders}
        renderItem={renderOrderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      />
    </View>
  );
};

export default AcceptedOrdersScreen;

