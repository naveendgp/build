import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import CustomText from '../../components/Text';
import ReceivedOrdersScreen from './TabScreens/ReceivedOrdersScreen';
import AcceptedOrdersScreen from './TabScreens/AcceptedOrdersScreen';
import CompletedOrdersScreen from './TabScreens/CompletedOrdersScreen';
import styles from './styles.ts';
import { COLORS, FONTFAMILY } from '../../constants/colors.ts';
import CustomSwitch from '../../components/CustomSwitch/index.tsx';
import DraggableSlider, { BasicDraggableSliderHandle } from '../../components/DraggableSlider/index.tsx';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OrderStatus } from '../../types/order/order.ts';
import { useOrdersCountStore } from '../../apiService/store/useOrdersCountStore';

const OrdersScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.RECEIVED);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabRefs = useRef<{ [key: string]: View | null }>({});
  const tabPositions = useRef<{ [key: string]: number }>({});
  const screenWidth = Dimensions.get('window').width;

  // Get order counts from store (updated by each tab when data loads)
  const getOrderCount = useOrdersCountStore(state => state.getCount);

  const handleTabPress = (tab: OrderStatus) => {
    setActiveTab(tab);

    // Scroll to center after a small delay to ensure the tab is rendered
    setTimeout(() => {
      const tabPosition = tabPositions.current[tab];
      if (tabPosition !== undefined && scrollViewRef.current) {
        const scrollPosition = tabPosition - (screenWidth / 2);
        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true,
        });
      } else {
        // Fallback: try using measureLayout
        const tabRef = tabRefs.current[tab];
        if (tabRef && scrollViewRef.current) {
          tabRef.measureLayout(
            scrollViewRef.current as any,
            (x, y, width, height) => {
              const scrollPosition = x - (screenWidth / 2) + (width / 2);
              scrollViewRef.current?.scrollTo({
                x: Math.max(0, scrollPosition),
                animated: true,
              });
            },
            () => {
              // Fallback: try using measure instead
              tabRef.measure((fx, fy, width, height, px, py) => {
                const scrollPosition = px - (screenWidth / 2) + (width / 2);
                scrollViewRef.current?.scrollTo({
                  x: Math.max(0, scrollPosition),
                  animated: true,
                });
              });
            }
          );
        }
      }
    }, 100);
  };

  const handleTabLayout = (tab: OrderStatus) => (event: any) => {
    const { x, width } = event.nativeEvent.layout;
    tabPositions.current[tab] = x + width / 2;
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
            Ready to accept orders
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
            Ready to accept orders
          </CustomText>
          <CustomSwitch value={true} onValueChange={() => { }} />
        </View>

      </View>

      {/* Tab Navigation */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
        style={{ backgroundColor: '#FFFFFF', maxHeight: 50, overflow: 'hidden' }}
        nestedScrollEnabled={true}
      >
        <View
          ref={(ref) => { tabRefs.current['received'] = ref; }}
          onLayout={handleTabLayout(OrderStatus.RECEIVED)}
        >
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress(OrderStatus.RECEIVED)}
            activeOpacity={0.7}
          >
            <CustomText
              style={[
                styles.tabText,
                activeTab === OrderStatus.RECEIVED && styles.tabTextActive,
              ]}
            >
              Received Orders
            </CustomText>
            {activeTab === OrderStatus.RECEIVED && <View style={styles.tabUnderline} />}
            <View style={styles.badge}>
              <CustomText style={styles.badgeText}>
                {getOrderCount(OrderStatus.RECEIVED).toString().padStart(2, '0')}
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>

        <View
          ref={(ref) => { tabRefs.current['accepted'] = ref; }}
          onLayout={handleTabLayout(OrderStatus.ACCEPTED)}
        >
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress(OrderStatus.ACCEPTED)}
            activeOpacity={0.7}
          >
            <CustomText
              style={[
                styles.tabText,
                activeTab === OrderStatus.ACCEPTED && styles.tabTextActive,
              ]}
            >
              Accepted Orders
            </CustomText>
            {activeTab === OrderStatus.ACCEPTED && <View style={styles.tabUnderline} />}
            <View style={styles.badge}>
              <CustomText style={styles.badgeText}>
                {getOrderCount(OrderStatus.ACCEPTED).toString().padStart(2, '0')}
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>

        <View
          ref={(ref) => { tabRefs.current[OrderStatus.READY_FOR_PICK_UP] = ref; }}
          onLayout={handleTabLayout(OrderStatus.READY_FOR_PICK_UP)}
        >
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress(OrderStatus.READY_FOR_PICK_UP)}
            activeOpacity={0.7}
          >
            <CustomText
              style={[
                styles.tabText,
                activeTab === OrderStatus.READY_FOR_PICK_UP && styles.tabTextActive,
              ]}
            >
              Ready For Pick Up
            </CustomText>
            {activeTab === OrderStatus.READY_FOR_PICK_UP && <View style={styles.tabUnderline} />}
            <View style={styles.badge}>
              <CustomText style={styles.badgeText}>
                {getOrderCount(OrderStatus.READY_FOR_PICK_UP).toString().padStart(2, '0')}
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>

        <View
          ref={(ref) => { tabRefs.current[OrderStatus.COMPLETED] = ref; }}
          onLayout={handleTabLayout(OrderStatus.COMPLETED)}
        >
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress(OrderStatus.COMPLETED)}
            activeOpacity={0.7}
          >
            <CustomText
              style={[
                styles.tabText,
                activeTab === OrderStatus.COMPLETED && styles.tabTextActive,
              ]}
            >
              Completed Orders
            </CustomText>
            {activeTab === OrderStatus.COMPLETED && <View style={styles.tabUnderline} />}
            <View style={styles.badge}>
              <CustomText style={styles.badgeText}>
                {getOrderCount(OrderStatus.COMPLETED).toString().padStart(2, '0')}
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Tab Content */}
      {activeTab === OrderStatus.RECEIVED && (
        <ReceivedOrdersScreen tabType={activeTab} />
      )}
      {activeTab === OrderStatus.ACCEPTED && (
        <AcceptedOrdersScreen tabType={activeTab} />
      )}
      {activeTab === OrderStatus.READY_FOR_PICK_UP && (
        <AcceptedOrdersScreen tabType={activeTab} />
      )}
      {activeTab === OrderStatus.COMPLETED && (
        <CompletedOrdersScreen tabType={activeTab} />
      )}
    </View>
  );
};

export default OrdersScreen;
