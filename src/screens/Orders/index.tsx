// src/screens/Orders/OrdersScreen.tsx
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, ScrollView, Dimensions, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import CustomText from '../../components/Text';
import ReceivedOrdersScreen from './TabScreens/ReceivedOrdersScreen';
import AcceptedOrdersScreen from './TabScreens/AcceptedOrdersScreen';
import CompletedOrdersScreen from './TabScreens/CompletedOrdersScreen';
import styles from './styles';
import { COLORS, FONTFAMILY } from '../../constants/colors';
import CustomSwitch from '../../components/CustomSwitch';
import { OrderStatus } from '../../types/order/order';
import { useOrdersCountStore } from '../../apiService/store/useOrdersCountStore';
import { useInitializeOrderCounts } from './hooks/useInitializeOrderCounts';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { toggleSettings } from '../../apiService/api/profileApi'; // <-- named import
import { ToggleSettingsInput, ToggleSettingsResponse } from '../../apiService/types/profileTypes';
import { showSuccessToast, showErrorToast } from '../../utils/Toast';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
const OrdersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.RECEIVED);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const tabRefs = useRef<{ [key: string]: any }>({});
  const tabPositions = useRef<{ [key: string]: number }>({});
  const screenWidth = Dimensions.get('window').width;
  const { profile, refreshProfile } = useProfileStore();

  // Initialize all order counts on mount
  useInitializeOrderCounts();

  // Subscribe to counts so badges re-render on updates
  const orderCounts = useOrdersCountStore(state => state.counts);
  const getOrderCount = useCallback(
    (status: OrderStatus) => orderCounts[status] ?? 0,
    [orderCounts],
  );

  // Get initial switch values from profile
  const initialShopStatus = useMemo(() => {
    return !!profile?.shop_status;
  }, [profile?.shop_status]);

  const initialExpressStatus = useMemo(() => {
    return !!profile?.express_status;
  }, [profile?.express_status]);

  const [shopStatus, setShopStatus] = useState<boolean>(initialShopStatus);
  const [expressStatus, setExpressStatus] = useState<boolean>(initialExpressStatus);

  // Update local state when profile changes
  useEffect(() => {
    if (typeof profile?.shop_status !== 'undefined') {
      console.log('profile.shop_status---------', profile.shop_status);
      setShopStatus(profile.shop_status);
    }
    if (typeof profile?.express_status !== 'undefined') {
      setExpressStatus(Boolean(profile.express_status));
    }
  }, [profile?.shop_status, profile?.express_status]);

  // DEBUG: temporarily check import validity (remove after confirming)
  // eslint-disable-next-line no-console
  console.log('toggleSettings import typeof:', typeof toggleSettings);

  // Toggle settings mutation
  const toggleSettingsMutation = useMutation<
    ToggleSettingsResponse,
    AxiosError<{ message: string }>,
    ToggleSettingsInput
  >({
    mutationFn: toggleSettings, // direct named function
    onSuccess: (data) => {
      showSuccessToast(data?.message || 'Settings updated successfully');
      // Refresh profile to get updated values
      refreshProfile();
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update settings';
      showErrorToast(errorMessage);
      // Optionally revert UI state if you optimistically updated it
    },
  });

  // Handle shop status toggle
  const handleShopStatusToggle = useCallback((value: boolean) => {
    // optimistic UI update
    setShopStatus(value);
    const payload: ToggleSettingsInput = {
      express_status: expressStatus,
      shop_status: value,
    };
    toggleSettingsMutation.mutate(payload);
  }, [expressStatus, toggleSettingsMutation]);

  // Handle express status toggle
  const handleExpressStatusToggle = useCallback((value: boolean) => {
    // optimistic UI update
    setExpressStatus(value);
    const payload: ToggleSettingsInput = {
      express_status: value,
      shop_status: shopStatus,
    };
    toggleSettingsMutation.mutate(payload);
  }, [shopStatus, toggleSettingsMutation]);

  // Handle back button/gesture navigation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If not on RECEIVED tab, navigate to RECEIVED tab
        if (activeTab !== OrderStatus.RECEIVED) {
          setActiveTab(OrderStatus.RECEIVED);
          // Scroll to RECEIVED tab
          setTimeout(() => {
            const tabPosition = tabPositions.current[OrderStatus.RECEIVED];
            if (tabPosition !== undefined && scrollViewRef.current) {
              const scrollPosition = tabPosition - (screenWidth / 2);
              scrollViewRef.current.scrollTo({
                x: Math.max(0, scrollPosition),
                animated: true,
              });
            }
          }, 100);
          return true; // Prevent default back action
        }
        // If already on RECEIVED tab, allow default back action (exit app)
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [activeTab, screenWidth])
  );

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
            (x: number, y: number, width: number, height: number) => {
              const scrollPosition = x - (screenWidth / 2) + (width / 2);
              scrollViewRef.current?.scrollTo({
                x: Math.max(0, scrollPosition),
                animated: true,
              });
            },
            () => {
              // Fallback: try using measure instead
              tabRef.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
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

  const isMutationPending = toggleSettingsMutation.isPending ?? false;

  return (
    <SafeAreaView style={[styles.container,]}>
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

          <CustomSwitch
            value={shopStatus}
            onValueChange={handleShopStatusToggle}
            disabledColor={COLORS.LOGIN_SUBTITLE}
            disabled={isMutationPending}
          />
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
          <CustomSwitch
            value={expressStatus}
            onValueChange={handleExpressStatusToggle}
            disabledColor={COLORS.LOGIN_SUBTITLE}
            disabled={isMutationPending}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
        style={{ maxHeight: 40, overflow: 'hidden' }}
        nestedScrollEnabled={true}
      >
        <View
          ref={(ref) => { tabRefs.current[OrderStatus.RECEIVED] = ref; }}
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
            {getOrderCount(OrderStatus.RECEIVED) > 0 && (
              <View style={styles.badge}>
                <CustomText style={styles.badgeText}>
                  {getOrderCount(OrderStatus.RECEIVED).toString().padStart(2, '0')}
                </CustomText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View
          ref={(ref) => { tabRefs.current[OrderStatus.ACCEPTED] = ref; }}
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
            {getOrderCount(OrderStatus.ACCEPTED) > 0 && (
              <View style={styles.badge}>
                <CustomText style={styles.badgeText}>
                  {getOrderCount(OrderStatus.ACCEPTED).toString().padStart(2, '0')}
                </CustomText>
              </View>
            )}
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
            {getOrderCount(OrderStatus.READY_FOR_PICK_UP) > 0 && (
              <View style={styles.badge}>
                <CustomText style={styles.badgeText}>
                  {getOrderCount(OrderStatus.READY_FOR_PICK_UP).toString().padStart(2, '0')}
                </CustomText>
              </View>
            )}
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
            {getOrderCount(OrderStatus.COMPLETED) > 0 && (
              <View style={styles.badge}>
                <CustomText style={styles.badgeText}>
                  {getOrderCount(OrderStatus.COMPLETED).toString().padStart(2, '0')}
                </CustomText>
              </View>
            )}
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
    </SafeAreaView>
  );
};

export default OrdersScreen;
