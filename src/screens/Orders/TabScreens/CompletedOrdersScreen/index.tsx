import React, { useMemo } from 'react';
import { View, RefreshControl, SectionList } from 'react-native';
import CompletedOrderCard, { CompletedOrderCardProps } from '../../CardComponents/CompletedOrderCard';
import CustomText from '../../../../components/Text';
import styles from './style';
import { OrderStatus } from '../../../../types/order/order';

interface CompletedOrdersScreenProps {
  tabType: OrderStatus;
  orders?: CompletedOrderCardProps[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface SectionData {
  title: string;
  data: CompletedOrderCardProps[];
}

const CompletedOrdersScreen: React.FC<CompletedOrdersScreenProps> = ({
  tabType,
  orders,
  onRefresh,
  refreshing = false,
}) => {
  // Static data for completed orders with timeline
  const staticData: CompletedOrderCardProps[] = [
    {
      orderId: '1234567',
      location: 'Tambaram, chennai',
      orderType: 'express',
      serviceQuantity: '1',
      serviceType: 'Iron',
      timeline: [
        {
          status: 'Order Received',
          date: '12th Oct',
          time: '4:24 AM',
          isCompleted: true,
        },
        {
          status: 'Order Picked up',
          date: '12th Oct',
          time: '4:24 PM',
          isCompleted: true,
        },
      ],
      totalPrice: '500.00',
      onViewDetails: () => console.log('View details 1'),
    },
    {
      orderId: '1234567',
      location: 'Tambaram, chennai',
      orderType: 'standard',
      serviceQuantity: '1',
      serviceType: 'Iron',
      timeline: [
        {
          status: 'Order Received',
          date: '12th Oct',
          time: '4:24 AM',
          isCompleted: true,
        },
        {
          status: 'Order Picked up',
          date: '12th Oct',
          time: '4:24 PM',
          isCompleted: true,
        },
        {
          status: 'Reached customer',
          date: '12th Oct',
          time: '4:24 PM',
          isCompleted: true,
        },
      ],
      totalPrice: '500.00',
      onViewDetails: () => console.log('View details 2'),
    },
  ];

  // Load data based on orders prop or static data
  const displayOrders = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders;
    }
    return staticData;
  }, [orders]);

  // Group orders by date (Today/Yesterday)
  const groupedData = useMemo(() => {
    const sections: SectionData[] = [
      { title: 'Today', data: [] },
      { title: 'Yesterday', data: [] },
    ];

    // For now, split by index - in real app, this would be based on actual dates
    displayOrders.forEach((order, index) => {
      if (index === 0) {
        sections[0].data.push(order); // Today
      } else {
        sections[1].data.push(order); // Yesterday
      }
    });

    // Filter out empty sections
    return sections.filter(section => section.data.length > 0);
  }, [displayOrders]);

  const renderOrderItem = ({ item }: { item: CompletedOrderCardProps }) => (
    <CompletedOrderCard {...item} />
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <CustomText style={styles.sectionHeaderText}>{section.title}</CustomText>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <CustomText style={styles.emptyText}>No completed orders</CustomText>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={groupedData}
        renderItem={renderOrderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => `${item.orderId}-${index}`}
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

