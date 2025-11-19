import React, { useMemo, useCallback } from 'react';
import { View, RefreshControl, SectionList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import CompletedOrderCard, { CompletedOrderCardProps } from '../../CardComponents/CompletedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';
import { OrderStatus } from '../../../../types/order/order';
import { VendorOrder } from '../../../../apiService/types/ordersTypes';
import { CompletedSection, mapOrdersToCompletedSections } from '../../utils/orderMappers';

type CompletedOrdersNavProp = NativeStackNavigationProp<RootStackParamList>;

interface CompletedOrdersScreenProps {
  tabType: OrderStatus;
  orders?: VendorOrder[];
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
}

const CompletedOrdersScreen: React.FC<CompletedOrdersScreenProps> = ({
  tabType: _tabType,
  orders,
  onRefresh,
  refreshing = false,
  loading = false,
}) => {
  const navigation = useNavigation<CompletedOrdersNavProp>();

  const groupedData = useMemo<CompletedSection[]>(
    () => mapOrdersToCompletedSections(orders),
    [orders],
  );

  const handleNavigateToDetails = useCallback(
    (order: VendorOrder, card: CompletedOrderCardProps) => {
      navigation.navigate('OrderDetails', {
        order: {
          orderId: card.orderId,
          location: card.location,
          orderType: card.orderType,
          serviceType: card.serviceType,
          serviceQuantity: card.serviceQuantity,
          serviceWeight: card.serviceWeight,
          timeline: card.timeline,
          itemTotal: card.totalPrice,
          gst: order.payment_details?.gst?.toString() ?? '0',
          gstPercentage: '18',
          grandTotal: card.totalPrice,
          customerName: order.user_address.label || 'Customer',
        },
      });
    },
    [navigation],
  );

  const renderOrderItem = useCallback(
    ({ item }: { item: CompletedSection['data'][number] }) => (
      <CompletedOrderCard
        {...item.card}
        onViewDetails={() => handleNavigateToDetails(item.source, item.card)}
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
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <CustomText style={styles.emptyText}>No completed orders</CustomText>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={groupedData}
        renderItem={renderOrderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.card.orderId}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      />
    </View>
  );
};

export default CompletedOrdersScreen;

