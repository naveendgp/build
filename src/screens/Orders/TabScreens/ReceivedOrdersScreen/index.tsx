import React, { useEffect } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import ReceivedOrderCard, { ReceivedOrderCardProps } from '../../CardComponents/RecivedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';
import socket from '../../../../apiService/socket/socket';
import { useFocusEffect } from '@react-navigation/native';
import { SOCKET_ENDPOINTS } from '../../../../constants';

interface ReceivedOrdersScreenProps {
  orders?: ReceivedOrderCardProps[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

const ReceivedOrdersScreen: React.FC<ReceivedOrdersScreenProps> = ({
  orders = [],
  onRefresh,
  refreshing = false,
}) => {
  // Default sample data if no orders provided
  const defaultOrders: ReceivedOrderCardProps[] = [
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
  ];

  const displayOrders = orders.length > 0 ? orders : defaultOrders;

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
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <CustomText style={styles.emptyText}>No received orders</CustomText>
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

