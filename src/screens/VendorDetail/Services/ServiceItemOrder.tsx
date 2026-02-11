import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  BackHandler
} from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import { COLORS, FONTFAMILY } from "../../../constants";
import CustomText from "../../../components/Text";
import Toolbar from "../../../components/Toolbar";
import CustomBtn from "../../../components/CustomBtn";
import LaundryItemCard from "../../../components/LaundryItemCard";
import CustomSwitch from "../../../components/CustomSwitch";
import TimerIcon from "../../../assets/auto-generated-svg-icons/TimerIcon";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { OrderItem } from "../../OrderReview/OrderReviewTopServiceItemOrder";
import { useServiceItems, ServiceItem } from "../hooks/useServiceItems";
import { useOrderStore } from "../../../state/zustand/orderStore";
import CustomDialog from "../../../components/CustomDialog";
import { showErrorToast } from "../../../components/Toast/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ServiceItemOrderNavProp = NativeStackNavigationProp<RootStackParamList, "ServiceItemOrder">;
type ServiceItemOrderRouteProp = RouteProp<RootStackParamList, "ServiceItemOrder">;

const DEFAULT_CATEGORIES = ["Men", "Women", "Kids", "Household", "Pet"] as const;

const ServiceItemOrder: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ServiceItemOrderNavProp>();
  const route = useRoute<ServiceItemOrderRouteProp>();
  const { serviceName, vendorDetails, tabCategories, serviceId, maxCountPerItem } = route.params || {};

  const { serviceItems, updateServiceItems } = useServiceItems(tabCategories);
  const [activeTab, setActiveTab] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { selectedOrderItems, setSelectedOrderItems, isExpress, setIsExpress, clearAll } = useOrderStore();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const allowNavigationRef = useRef(false);

  const totalItems = useMemo(
    () => Object.values(quantities).reduce((a, b) => a + b, 0),
    [quantities]
  );

  const handleClearAll = useCallback(() => { clearAll(); setQuantities({}); }, [clearAll]);

  // Toolbar back should show discard dialog (explicit toolbar action)
  const handleToolbarBack = useCallback(() => {
    if (totalItems > 0 && !allowNavigationRef.current) {
      setShowDiscardDialog(true);
    } else {
      allowNavigationRef.current = true;
      navigation.goBack();
      // reset allow flag shortly after to avoid side effects
      setTimeout(() => { allowNavigationRef.current = false; }, 100);
    }
  }, [totalItems, navigation]);

  // Hardware back handler: intercept and show discard if items selected
  const handleBackPress = useCallback(() => {
    if (!navigation.isFocused()) return false;

    if (totalItems > 0 && !allowNavigationRef.current) {
      setShowDiscardDialog(true);
      return true; // Prevent default back behavior
    } else {
      // allow default behavior
      return false;
    }
  }, [totalItems, navigation]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    allowNavigationRef.current = true; // allow the upcoming navigation
    clearAll();
    setQuantities({});
    navigation.goBack();
    // reset allow flag shortly after navigation
    setTimeout(() => { allowNavigationRef.current = false; }, 100);
  }, [clearAll, navigation]);

  useEffect(() => {
    if (serviceName && vendorDetails) {
      updateServiceItems(serviceName, vendorDetails);
    }
  }, [serviceName, vendorDetails, updateServiceItems]);

  // Intercept gesture back navigation (swipe back / beforeRemove)
  // Now only intercept GO_BACK / POP (gesture/hardware) and allow RESET/programmatic navigation.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      const actionType = e?.data?.action?.type;

      if (!navigation.isFocused()) {
        return;
      }

      // Allow navigation if we explicitly allowed it (programmatic flows)
      if (allowNavigationRef.current) {
        return;
      }

      // Allow RESET (programmatic resets) — we only want to block gesture/hardware back
      if (actionType === 'RESET') {
        return;
      }

      // Only intercept explicit back/pop gestures
      if (actionType === 'GO_BACK' || actionType === 'POP') {
        if (showDiscardDialog) {
          return;
        }
        if (totalItems > 0) {
          e.preventDefault();
          setShowDiscardDialog(true);
        }
      }
      // ignore other action types
    });

    return unsubscribe;
  }, [navigation, totalItems, showDiscardDialog]);

  // Hardware back listener
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  // Sync quantities from store when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset navigation flag when screen comes into focus
      allowNavigationRef.current = false;

      if (selectedOrderItems && selectedOrderItems.length > 0) {
        const updatedQuantities: Record<string, number> = {};
        selectedOrderItems.forEach((item) => {
          updatedQuantities[item.id] = item.quantity;
        });
        setQuantities(updatedQuantities);
      }
    }, [selectedOrderItems])
  );

  const categories = tabCategories || DEFAULT_CATEGORIES;

  const totalAmount = useMemo(() => {
    let sum = 0;
    categories.forEach((category) => {
      const items = serviceItems[category] || [];
      for (const item of items) {
        const q = quantities[item.item_id] || 0;
        const price = isExpress ? item.express_price : item.item_price;
        sum += q * price;
      }
    });
    return sum;
  }, [quantities, serviceItems, categories, isExpress]);

  // Proceed -> navigate to OrderReview. Mark allowNavigationRef to true so
  // programmatic navigation won't be intercepted by beforeRemove.
  const handleProceed = useCallback(() => {
    if (totalItems === 0) return;

    // if (maxCountPerItem && totalItems > maxCountPerItem) {
    //   if (maxCountPerItem === 0) {
    //     showErrorToast(`Currently this service is not available for this vendor.`);
    //   } else {
    //     showErrorToast(`You can select a maximum of ${maxCountPerItem} items for this service.`);
    //   }
    //   return;
    // }

    // Convert quantities to OrderItem format
    const orderItems: OrderItem[] = [];
    categories.forEach((category) => {
      const items = serviceItems[category] || [];
      items.forEach((item) => {
        const qty = quantities[item.item_id] || 0;
        if (qty > 0) {
          const price = isExpress ? item.express_price : item.item_price;
          orderItems.push({
            id: item.item_id,
            name: item.item_name,
            price: price,
            quantity: qty,
            category: category,
            service_id: serviceId,
            service_name: serviceName,
            express_price: item.express_price,
          });
        }
      });
    });

    setSelectedOrderItems(orderItems);

    // Allow programmatic navigation; prevents discard dialog from popping
    allowNavigationRef.current = true;
    navigation.navigate("OrderReview", {
      serviceType: "ServiceItemOrder",
      serviceItemOrderName: serviceName || "",
      serviceItemOrderItems: orderItems,
      vendorName: vendorDetails?.shop_name || "",
      location: "Home - Radha Nagar",
    });

    // Clear the allow flag after a short delay to avoid accidental bypass later
    setTimeout(() => { allowNavigationRef.current = false; }, 200);
  }, [
    categories,
    serviceItems,
    quantities,
    isExpress,
    navigation,
    serviceName,
    vendorDetails,
    serviceId,
    setSelectedOrderItems,
    totalItems,
    maxCountPerItem
  ]);



  const renderItem = ({ item }: { item: ServiceItem }) => {
    const qty = quantities[item.item_id] || 0;
    const handleDecrement = () => setQuantities((prev) => ({ ...prev, [item.item_id]: Math.max(0, (prev[item.item_id] || 0) - 1) }));
    const handleIncrement = () => {
      const current = quantities[item.item_id] || 0;
      if (maxCountPerItem && maxCountPerItem > 0 && current >= maxCountPerItem) {
        showErrorToast(`Maximum ${maxCountPerItem} items allowed for this service`);
        return;
      }
      setQuantities((prev) => ({ ...prev, [item.item_id]: (prev[item.item_id] || 0) + 1 }));
    };

    return (
      <LaundryItemCard
        key={item.item_id}
        item={item}
        quantity={qty}
        onDecrement={handleDecrement}
        onIncrement={handleIncrement}
        minQuantity={0}
        express={isExpress}
      />
    );
  };

  return (
    <LinearGradient colors={[COLORS.GRADIENT_GREEN, COLORS.WHITE]} style={styles.root}>
      <Toolbar title={serviceName || "Service"} onBackPress={handleToolbarBack} />

      {/* SLA Row */}
      <View style={styles.slaRow}>
        <TimerIcon />
        <CustomText style={styles.slaText}>{vendorDetails?.services_offered?.find(service => service.service_name === serviceName)?.normal_delivery_time_minutes ?? ''}</CustomText>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {categories.map((tab, idx) => (
          <TouchableOpacity
            key={String(idx)}
            onPress={() => setActiveTab(idx)}
            style={[styles.tabBtn, idx === activeTab && styles.tabBtnActive]}
          >
            <CustomText style={[styles.tabText, idx === activeTab && styles.tabTextActive]}>{tab}</CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <CustomText style={styles.summaryLeft}>{`Total Items Selected (${totalItems})`}</CustomText>
        <TouchableOpacity onPress={handleClearAll}>
          <CustomText style={styles.clearAll}>Clear All</CustomText>
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={styles.listWrapper}>
        <FlatList
          data={serviceItems[categories[activeTab]] || []}
          keyExtractor={(i) => i.item_id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}
        />
      </View>

      {/* Bottom */}
      <View style={[styles.bottomBox, { paddingBottom: insets.bottom + 16 }]}>
        {vendorDetails?.services_offered?.find(service => service.service_name === serviceName)?.is_express_available &&
          (<View style={styles.expressRow}>
            <CustomText style={styles.expressText}>{'Express Service in ' + (vendorDetails?.services_offered?.find(service => service.service_name === serviceName)?.express_delivery_time_minutes ?? '')}</CustomText>
            <CustomSwitch value={isExpress} onValueChange={() => setIsExpress(!isExpress)} />
          </View>)}
        <CustomBtn
          title={`${serviceName || ""} ₹ ${totalAmount ?? 0}`}
          onPress={handleProceed}
          style={styles.ctaBtn}
          disabled={totalItems === 0}
        />
      </View>

      <CustomDialog
        visible={showDiscardDialog}
        title="Discard Changes"
        content="Are you sure you want to discard the selected items?"
        onClose={() => {
          setShowDiscardDialog(false);
          allowNavigationRef.current = false; // Reset flag when dialog closes
        }}
        onConfirm={confirmDiscard}
        confirmText="Yes"
        cancelText="No"
      />
    </LinearGradient>
  );
};

export default ServiceItemOrder;

const styles = StyleSheet.create({
  root: { flex: 1, },
  slaRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 4, gap: 6 },
  slaText: { color: COLORS.LOGIN_SUBTITLE, fontFamily: FONTFAMILY.INTER_REGULAR, fontSize: 12 },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 8,
  },
  tabBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.INPUT_TEXT },
  tabText: {
    color: COLORS.LOGIN_SUBTITLE,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontSize: 18,
    fontWeight: '600',
  },
  tabTextActive: { color: COLORS.INPUT_TEXT },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 16,
  },
  summaryLeft: {
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontSize: 16,
    fontWeight: '500',
  },
  clearAll: {
    color: COLORS.LOGOUT_TEXT,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontSize: 16,
    fontWeight: '600',
  },

  listWrapper: { flex: 1, marginTop: 16 },

  bottomBox: {
    padding: 16,
    backgroundColor: COLORS.WHITE,
  },
  expressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.EXPRESS_BORDER,
    backgroundColor: COLORS.Express_background,
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 40,
    marginBottom: 8,
  },
  expressText: {
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontSize: 14,
    fontWeight: '400',
  },
  ctaBtn: { borderRadius: 12 },
});
