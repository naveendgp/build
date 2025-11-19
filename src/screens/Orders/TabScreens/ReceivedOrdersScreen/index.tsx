import React, { useEffect, useMemo } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import ReceivedOrderCard, { ReceivedOrderCardProps } from '../../CardComponents/RecivedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';
import socket from '../../../../apiService/socket/socket';
import { useFocusEffect } from '@react-navigation/native';
import { SOCKET_ENDPOINTS } from '../../../../constants';
import { OrderStatus } from '../../../../types/order/order';

interface ReceivedOrdersScreenProps {
  tabType: OrderStatus;
  orders?: ReceivedOrderCardProps[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

const ReceivedOrdersScreen: React.FC<ReceivedOrdersScreenProps> = ({
  tabType,
  orders,
  onRefresh,
  refreshing = false,
}) => {
  console.log('tabType', tabType);
  // Static data for all tab types
  const staticData: { [key in OrderStatus]: ReceivedOrderCardProps[] } = {
    [OrderStatus.RECEIVED]: [
      {
        orderId: '1234567',
        location: 'Tambaram, chennai',
        orderType: 'standard',
        customerName: 'Srivathsan',
        time: '12:40 PM',
        serviceQuantity: '15 X',
        serviceType: 'Iron',
        customerNote: 'This is a sample note once the the app goes live the original note will appear here',
        totalBill: '450.64',
        timer: '00:04:59',
        onAccept: () => console.log('Accept order 1'),
        onViewDetails: () => console.log('View details 1'),
        onViewBill: () => console.log('View bill 1'),
      },
      {
        orderId: '1234568',
        location: 'Tambaram, chennai',
        orderType: 'express',
        customerName: 'Srivathsan',
        orderNumber: 7,
        time: '12:40 PM',
        serviceWeight: 'Medium 4Kg - 6kg',
        serviceType: 'Wash',
        customerNote: 'This is a sample note once the the app goes live the original note will appear here',
        timer: '00:04:59',
        onAccept: () => console.log('Accept order 2'),
        onViewDetails: () => console.log('View details 2'),
        onViewBill: () => console.log('View bill 2'),
      },
    ],
    [OrderStatus.ACCEPTED]: [
      {
        orderId: '1234569',
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
        orderId: '1234570',
        location: 'Adyar, chennai',
        orderType: 'express',
        customerName: 'Jane Smith',
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
    ],
    [OrderStatus.READY_FOR_PICK_UP]: [
      {
        orderId: '1234571',
        location: 'T Nagar, chennai',
        orderType: 'standard',
        customerName: 'Robert Wilson',
        time: '09:00 AM',
        serviceQuantity: '20 X',
        serviceType: 'Iron',
        customerNote: 'Handle with extra care',
        totalBill: '600.00',
        timer: '00:00:00',
        onAccept: () => console.log('Accept order 5'),
        onViewDetails: () => console.log('View details 5'),
        onViewBill: () => console.log('View bill 5'),
      },
      {
        orderId: '1234572',
        location: 'Anna Nagar, chennai',
        orderType: 'express',
        customerName: 'Sarah Johnson',
        time: '08:30 AM',
        serviceWeight: 'Large 8Kg - 10kg',
        serviceType: 'Wash',
        customerNote: 'Ready for pickup',
        totalBill: '750.00',
        timer: '00:00:00',
        onAccept: () => console.log('Accept order 6'),
        onViewDetails: () => console.log('View details 6'),
        onViewBill: () => console.log('View bill 6'),
      },
    ],
    [OrderStatus.COMPLETED]: [
      {
        orderId: '1234573',
        location: 'Velachery, chennai',
        orderType: 'standard',
        customerName: 'Michael Brown',
        time: 'Yesterday 5:00 PM',
        serviceQuantity: '12 X',
        serviceType: 'Iron',
        customerNote: 'Completed successfully',
        totalBill: '420.00',
        timer: '00:00:00',
        onAccept: () => console.log('Accept order 7'),
        onViewDetails: () => console.log('View details 7'),
        onViewBill: () => console.log('View bill 7'),
      },
      {
        orderId: '1234574',
        location: 'Guindy, chennai',
        orderType: 'express',
        customerName: 'Emily Davis',
        time: 'Yesterday 3:00 PM',
        serviceWeight: 'Medium 4Kg - 6kg',
        serviceType: 'Wash',
        customerNote: 'Customer satisfied',
        totalBill: '380.00',
        timer: '00:00:00',
        onAccept: () => console.log('Accept order 8'),
        onViewDetails: () => console.log('View details 8'),
        onViewBill: () => console.log('View bill 8'),
      },
    ],
  };

  // Load data based on tabType
  const displayOrders = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders;
    }
    return staticData[tabType] || [];
  }, [orders, tabType]);

  useEffect(() => {
    const connectSocket = async () => {
      try {
        await socket.connect();
        console.log('Socket connected successfully');
      } catch (err) {
        console.error('Failed to connect socket:', err);
      }
    };
    connectSocket();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      let handleData: ((data: any) => void) | null = null;

      const setupSocketListeners = async () => {
        try {
          const sock = socket.getSocket();

          if (!sock?.connected) {
            await socket.connect();
          }

          if (!isMounted) return;

          handleData = (data: any) => {
            console.log('Received data:', data);
          };

          socket.on(SOCKET_ENDPOINTS.VENDOR_ORDER, handleData);
        } catch (err) {
          console.error('Failed to connect socket:', err);
        }
      };

      setupSocketListeners();

      return () => {
        isMounted = false;
        if (handleData) {
          socket.off(SOCKET_ENDPOINTS.VENDOR_ORDER, handleData);
        }
      };
    }, [])
  );

  const renderOrderItem = ({ item, index }: { item: ReceivedOrderCardProps; index: number }) => (
    <ReceivedOrderCard
      key={`${item.orderId}-${index}`}
      {...item}
      tabType={tabType}
    />
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
      <CustomText style={styles.emptyText}>{getEmptyText()}</CustomText>
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

export default ReceivedOrdersScreen;

