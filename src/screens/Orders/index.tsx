import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import OrderCard from "./component/OrderCard";
import { COLORS } from "../../constants/colors";
import { FONTFAMILY } from "../../constants/fonts";
import LinearGradient from "react-native-linear-gradient";
import CustomText from "../../components/Text";
import { useNavigation } from "@react-navigation/native";
import NotificationIcon from "../../assets/auto-generated-svg-icons/NotificationIcon";
import styles from "./style";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import EmptyScreen from "../../components/EmptyScreen";
import { ordersHistoryService } from "../../services/ordersHistoryService";
import { Order } from "../../types/order/order";
import ErrorState from "../../components/ErrorState";
import { getErrorMessageFromMultiple } from "../../utils/errorUtils";
import BackgroundGradient from "../../components/backgroundGradient";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
type Nav = NativeStackNavigationProp<RootStackParamList>;



type ListItem =
  | { type: 'header'; title: string; id: string }
  | { type: 'order'; order: Order; id: string };

const OrdersScreen: React.FC = () => {

  const insets = useSafeAreaInsets();

  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const fetchOrders = useCallback(async (pageNum: number = 1, isInitial: boolean = false, isRefresh: boolean = false) => {
    if (isInitial && !isRefresh) {
      setIsLoading(true);
    } else if (!isRefresh) {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const response = await ordersHistoryService.getOrdersHistory(pageNum, limit);
      if (response.success && response.data?.data) {
        const newOrders = response.data.data.orders || [];
        const totalPages = response.data.data.totalPages || 1;

        if (isInitial) {
          setOrders(newOrders);
        } else {
          setOrders(prev => [...prev, ...newOrders]);
        }

        setHasMore(pageNum < totalPages);
        setPage(pageNum);
      } else {
        setError(response.error || "Failed to load orders");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    fetchOrders(1, true);
  }, [fetchOrders]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchOrders(page + 1, false);
    }
  }, [page, hasMore, isLoadingMore, fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await fetchOrders(1, true, true);
    setRefreshing(false);
  }, [fetchOrders]);

  // Check if order is history (delivered or cancelled)
  const isOrderHistory = (order: Order): boolean => {
    return order.status === "delivered" || order.status === "cancelled" || order.status === "unaccepted" || order.status === "rejected";
  };

  // Create combined list with headers
  const listItems = useMemo(() => {
    const items: ListItem[] = [];
    let lastType: 'active' | 'history' | null = null;

    orders.forEach((order) => {
      const isHistory = isOrderHistory(order);
      const currentType = isHistory ? 'history' : 'active';

      // Add header if type changes
      if (lastType !== currentType) {
        const headerTitle = currentType === 'active' ? 'Active Order' : 'Order History';
        items.push({
          type: 'header',
          title: headerTitle,
          id: `header-${currentType}-${order._id}`,
        });
        lastType = currentType;
      }

      // Add order
      items.push({
        type: 'order',
        order,
        id: `order-${order._id}`,
      });
    });

    return items;
  }, [orders]);

  // Format order data for OrderCard component
  const formatOrderForCard = (order: Order) => {
    const address = order.vendor_address;
    const location = order.vendor_address.address_line1;
    //  [address.city, address.state].filter(Boolean).join(", ");
    // const firstItem = order.items[0];
    const itemName = order?.items[0]?.service_name || "-";
    const totalItems = order.items.length;
    const quantity = order.items.reduce((total, item) => total + item.quantity, 0);
    const isWeightBased = order?.items[0]?.item_category === "weight";

    const weight = order?.is_verified ? (order.items.reduce((total, item) => total + item.weight, 0) + 'kg') : order?.items[0]?.item_name;

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
    };

    return {
      weight: weight,
      isWeightBased: isWeightBased,
      shopName: order.shop_name || order.vendor?.shop_name || "",
      location,
      rating: order.rating_given ? 0 : 0, // You might want to fetch vendor rating separately
      ratingGiven: order.rating_given,
      item: itemName,
      quantity: quantity,
      price: order.total_amount,
      status: order.status,
      isCompleted: isOrderHistory(order),
      pickedUp: formatDate(order.status_timestamps.picked_up_at) || formatDate(order.created_at) || "N/A",
      order: order, // Pass full order object for timeline building
      ...(order.status_timestamps.delivered_at && {
        delivered: formatDate(order.status_timestamps.delivered_at),
      }),
      ...(order.status_timestamps.accepted_at && !order.status_timestamps.picked_up_at && {
        eta: formatDate(order.status_timestamps.accepted_at),
      }),
      ...(order.status_timestamps.unaccepted_at && {
        unaccepted: formatDate(order.status_timestamps.unaccepted_at),
      }),
    };
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle} fontWeight="Bold">
            {item.title}
          </CustomText>
        </View>
      );
    }

    const order = item.order;
    const isHistory = isOrderHistory(order);
    const screenName = isHistory ? "CompletedOrderDetailsScreen" : "ActiveOrderScreen";

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate(screenName as any, { orderId: order._id })}>
        <OrderCard {...formatOrderForCard(order)} />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={COLORS.THEME_GREEN} />
      </View>
    );
  };

  return (
    <View
      style={{ flex: 1, }}
    >
      <BackgroundGradient />
      {/* Header */}
      <View style={{
        flex: 1,
        position: 'absolute', width: '100%', height: '100%', paddingTop: insets.top + 24
      }}>
        <View style={styles.headerRow}>
          <CustomText style={styles.headerTitle}>Orders</CustomText>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate("NotificationScreen")}>
            <NotificationIcon />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
          </View>
        ) : error ? (
          <ErrorState onRetry={onRefresh}
            retryButtonText="Retry"
            message={getErrorMessageFromMultiple([error])} />
        ) : listItems.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.THEME_GREEN]}
                tintColor={COLORS.THEME_GREEN}
              />
            }
          >
            <EmptyScreen title="No Orders Yet" subtitle="Let's place your first order!" />
          </ScrollView>
        ) : (
          <FlatList
            data={listItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.THEME_GREEN]}
                tintColor={COLORS.THEME_GREEN}
              />
            }
          />
        )}
      </View>

    </View>
  );
};



export default OrdersScreen;
