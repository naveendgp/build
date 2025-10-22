import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import CustomText from '../../components/Text';
import styles from './styles.ts';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type OrdersNavProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<OrdersNavProp>();

  const orders = [
    {
      id: '1',
      customerName: 'John Doe',
      items: '5 Shirts, 3 Pants',
      status: 'In Progress',
      amount: '₹450',
      date: '2024-01-15',
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      items: '2 Suits, 1 Blazer',
      status: 'Completed',
      amount: '₹1200',
      date: '2024-01-14',
    },
    {
      id: '3',
      customerName: 'Mike Johnson',
      items: '10 T-shirts',
      status: 'Pending',
      amount: '₹300',
      date: '2024-01-13',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#34C759';
      case 'In Progress':
        return '#FF9500';
      case 'Pending':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.title}>Orders</CustomText>
        <CustomText style={styles.subtitle}>Manage your laundry orders</CustomText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetails', { order })}
          >
            <View style={styles.orderHeader}>
              <View>
                <CustomText style={styles.customerName}>{order.customerName}</CustomText>
                <CustomText style={styles.orderDate}>{order.date}</CustomText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <CustomText style={styles.statusText}>{order.status}</CustomText>
              </View>
            </View>
            
            <View style={styles.orderDetails}>
              <CustomText style={styles.itemsText}>{order.items}</CustomText>
              <CustomText style={styles.amountText}>{order.amount}</CustomText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default OrdersScreen;
