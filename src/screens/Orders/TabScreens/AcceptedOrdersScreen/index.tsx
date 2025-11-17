import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import ReceivedOrderCard, { ReceivedOrderCardProps } from '../../CardComponents/RecivedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';

interface AcceptedOrdersScreenProps {
  orders?: ReceivedOrderCardProps[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

const AcceptedOrdersScreen: React.FC<AcceptedOrdersScreenProps> = ({
  orders = [],
  onRefresh,
  refreshing = false,
}) => {
  // Default sample data if no orders provided
  const defaultOrders: ReceivedOrderCardProps[] = [
    {
      orderId: '1234568',
      location: 'Tambaram, chennai',
      orderType: 'standard',
      customerName: 'John Doe',
      time: '11:30 AM',
      serviceQuantity: '10 X',
      serviceType: 'Iron',
      customerNote: 'Please handle with care',
      totalBill: '350.00',
      timer: '00:02:30',
      onAccept: () => console.log('Accept order 3'),
      onViewDetails: () => console.log('View details 3'),
      onViewBill: () => console.log('View bill 3'),
    },
    {
      orderId: '1234569',
      location: 'Tambaram, chennai',
      orderType: 'express',
      customerName: 'Jane Smith',
      orderNumber: 3,
      time: '10:15 AM',
      serviceWeight: 'Small 2Kg - 4kg',
      serviceType: 'Wash',
      customerNote: 'Quick delivery needed',
      totalBill: '280.50',
      timer: '00:01:45',
      onAccept: () => console.log('Accept order 4'),
      onViewDetails: () => console.log('View details 4'),
      onViewBill: () => console.log('View bill 4'),
    },
  ];

  const displayOrders = orders.length > 0 ? orders : defaultOrders;

  const renderOrderItem = ({ item, index }: { item: ReceivedOrderCardProps; index: number }) => (
    <ReceivedOrderCard
      key={`${item.orderId}-${index}`}
      {...item}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <CustomText style={styles.emptyText}>No accepted orders</CustomText>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={displayOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => `${item.orderId}-${index}`}
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

