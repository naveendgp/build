import React, { useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import CustomText from '../../components/Text';
import { ReceivedOrderCardProps } from './CardComponents/RecivedOrderCard';
import ReceivedOrdersScreen from './TabScreens/ReceivedOrdersScreen';
import AcceptedOrdersScreen from './TabScreens/AcceptedOrdersScreen';
import styles from './styles.ts';
import { COLORS, FONTFAMILY } from '../../constants/colors.ts';
import CustomSwitch from '../../components/CustomSwitch/index.tsx';
import DraggableSlider, { BasicDraggableSliderHandle } from '../../components/DraggableSlider/index.tsx';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type OrderStatus = 'received' | 'accepted';

const OrdersScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus>('received');
  const [refreshing, setRefreshing] = useState(false);

  // Sample orders data - in real app, this would come from API
  const receivedOrders: ReceivedOrderCardProps[] = [
    {
      orderId: '1234567',
      location: 'Tambaram, chennai',
      orderType: 'standard',
      customerName: 'Srivathsan',
      time: '12:40 PM',
      serviceQuantity: '15 X',
      serviceType: 'Iron',
      customerNote:
        'This is a sample note once the the app goes live the original note will appear here',
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
      customerNote:
        'This is a sample note once the the app goes live the original note will appear here',
      timer: '00:04:59',
      onAccept: () => console.log('Accept order 2'),
      onViewDetails: () => console.log('View details 2'),
      onViewBill: () => console.log('View bill 2'),
    },
  ];

  const acceptedOrders: ReceivedOrderCardProps[] = [
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
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={{
            backgroundColor: COLORS.INPUT_TEXT,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16
          }}
        >
          <CustomText
            style={{
              color: COLORS.BUTTON_BACKGROUND,
              fontSize: 16,
              fontWeight: '500',
              fontFamily: FONTFAMILY.INTER_MEDIUM,
            }}
          >
            Ready To Accept Orders
          </CustomText>


          <CustomSwitch value={true} onValueChange={() => { }} />
        </View>

        <View
          style={{
            backgroundColor: COLORS.EXPRESS_BACKGROUND,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            borderWidth: 1,
            borderColor: COLORS.EXPRESS_BORDER,
          }}
        >
          <CustomText
            style={{
              color: COLORS.TEXT_PRIMARY,
              fontSize: 16,
              fontWeight: '500',
              fontFamily: FONTFAMILY.INTER_MEDIUM,
            }}
          >
            Ready To Accept Express Orders
          </CustomText>
          <CustomSwitch value={true} onValueChange={() => { }} />
        </View>

      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('received')}
          activeOpacity={0.7}
        >
          <CustomText
            style={[
              styles.tabText,
              activeTab === 'received' && styles.tabTextActive,
            ]}
          >
            Received Orders
          </CustomText>
          {activeTab === 'received' && <View style={styles.tabUnderline} />}
          <View style={styles.badge}>
            <CustomText style={styles.badgeText}>
              {receivedOrders.length.toString().padStart(2, '0')}
            </CustomText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('accepted')}
          activeOpacity={0.7}
        >
          <CustomText
            style={[
              styles.tabText,
              activeTab === 'accepted' && styles.tabTextActive,
            ]}
          >
            Accepted Orders
          </CustomText>
          {activeTab === 'accepted' && <View style={styles.tabUnderline} />}
          <View style={styles.badge}>
            <CustomText style={styles.badgeText}>
              {acceptedOrders.length.toString().padStart(2, '0')}
            </CustomText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'received' ? (
        <ReceivedOrdersScreen
          orders={receivedOrders}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      ) : (
        <AcceptedOrdersScreen
          orders={acceptedOrders}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </View>
  );
};

export default OrdersScreen;
