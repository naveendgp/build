import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
  LayoutChangeEvent,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Rect } from "react-native-svg";
import { COLORS, FONTFAMILY } from "../../../constants";
import CustomText from "../../../components/Text";
import Toolbar from "../../../components/Toolbar";
import CustomBtn from "../../../components/CustomBtn";
import CustomSwitch from "../../../components/CustomSwitch";
import TimerIcon from "../../../assets/auto-generated-svg-icons/TimerIcon";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { useServiceItems, ServiceItem } from "../hooks/useServiceItems";
import { useOrderStore } from "../../../state/zustand/orderStore";
import { OrderItem } from "../../OrderReview/OrderReviewTopServiceItemOrder";
import BackgroundGradient from "../../../components/backgroundGradient";
import SvgBasketIcon from "../../../assets/auto-generated-svg-icons/BasketIcon";
import KgBasketIcon from "../../../assets/auto-generated-svg-icons/KgBased";
import SvgRegularBagIcon from "../../../assets/auto-generated-svg-icons/RegularBagIcon";
import SvgStandardBagIcon from "../../../assets/auto-generated-svg-icons/StandardBagIcon";
import SvgMaxBagIcon from "../../../assets/auto-generated-svg-icons/MaxBagIcon";
import EmptyScreen from "../../../components/EmptyScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ServiceWeightOrderNavProp = NativeStackNavigationProp<RootStackParamList, "ServiceWeightOrder">;

type LoadSizeOption = "small" | "medium" | "large";

interface WeightItemOption {
  // use the vendor item id as the unique key
  id: string; // item.item_id
  size: LoadSizeOption;
  label: string;
  tierName: string; // Regular, Standard, Max
  weightRange: string; // (1-3kg), (4-6kg), (7-10kg)
  icon: any;
  TierIcon: React.FC<any>; // Tier-specific icon component
  item: ServiceItem | null;
}

// Tier configuration for friendly names and icons
const TIER_CONFIG: Record<LoadSizeOption, { tierName: string; weightRange: string; TierIcon: React.FC<any> }> = {
  small: { tierName: 'Regular', weightRange: '(1-3kg)', TierIcon: SvgRegularBagIcon },
  medium: { tierName: 'Standard', weightRange: '(4-6kg)', TierIcon: SvgStandardBagIcon },
  large: { tierName: 'Max', weightRange: '(7-10kg)', TierIcon: SvgMaxBagIcon },
};

const ServiceWeightOrder: React.FC = () => {
  const insets = useSafeAreaInsets();

  const navigation = useNavigation<ServiceWeightOrderNavProp>();
  const route = useRoute<RouteProp<RootStackParamList, "ServiceWeightOrder">>();

  const [selectedSize, setSelectedSize] = useState<LoadSizeOption>("small");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  // const [express, setExpress] = useState(false);
  const [pricingBoxDimensions, setPricingBoxDimensions] = useState({ width: 0, height: 0 });
  const { serviceName, serviceImage, vendorDetails, serviceId, tabCategories, serviceDetails } = route.params || {};
  const { serviceItems, updateServiceItems } = useServiceItems(tabCategories);
  const { setSelectedOrderItems, isExpress, setIsExpress } = useOrderStore();

  // Get weight category items (handle both "weight" and "Weight")
  const weightCategory = tabCategories?.[0] || "Weight";
  const weightItems = serviceItems[weightCategory] || [];


  // Map weight items to LoadSizeOption format
  const mapItemNameToSize = (itemName: string): LoadSizeOption | null => {
    const nameLower = itemName.toLowerCase();

    // Check for tier names first (Regular, Standard, Max)
    if (nameLower.includes('regular')) return 'small';
    if (nameLower.includes('standard')) return 'medium';
    if (nameLower.includes('max')) return 'large';

    // Try to parse numeric kg ranges like "0.5 kg - 3 kg" or "3 kg - 5 kg"
    const numberMatches = itemName.match(/\d+(?:\.\d+)?/g);
    if (numberMatches && numberMatches.length > 0) {
      const nums = numberMatches.map(n => parseFloat(n)).filter(n => !isNaN(n));
      if (nums.length > 0) {
        const max = Math.max(...nums);
        // Heuristic: <=3kg => small (Regular), <=6kg => medium (Standard), >6kg => large (Max)
        if (max <= 3) return 'small';
        if (max <= 6) return 'medium';
        return 'large';
      }
    }

    return null;
  };

  // Create load size options from API items with tier configuration
  const loadSizeOptions: WeightItemOption[] = useMemo(() => {
    const options: WeightItemOption[] = [];

    weightItems.forEach((item) => {
      const size = mapItemNameToSize(item.item_name);
      if (size) {
        // Frontend Deduplication check: Ensure we don't add the same size twice
        if (options.some(opt => opt.size === size)) return;

        const tierConfig = TIER_CONFIG[size];
        console.log("item.image_url :", item.image_url);
        options.push({
          id: item.item_id,
          size,
          label: item.item_name,
          tierName: tierConfig.tierName,
          weightRange: tierConfig.weightRange,
          icon: item.image_url ? { uri: item.image_url } : require("../../../assets/icons/Wash.png"),
          TierIcon: tierConfig.TierIcon,
          item: item,
        });
      }
    });

    // Dynamically determine present size order based on available sizes
    const canonicalOrder: LoadSizeOption[] = ["small", "medium", "large"];
    const presentOrder = canonicalOrder.filter(s => options.some(o => o.size === s));

    options.sort((a, b) => presentOrder.indexOf(a.size) - presentOrder.indexOf(b.size));

    return options;
  }, [weightItems]);

  // Set default selected size when options are loaded
  useEffect(() => {
    if (loadSizeOptions.length > 0) {
      const first = loadSizeOptions[0];
      // default to the first available option (use id for unique selection and size for price/logic)
      if (!loadSizeOptions.find(opt => opt.size === selectedSize)) {
        setSelectedSize(first.size);
      }
      if (!selectedOptionId) {
        setSelectedOptionId(first.id);
      }
    }
  }, [loadSizeOptions, selectedSize]);

  // Debug: show computed load size options
  useEffect(() => {
    console.log('loadSizeOptions computed:', loadSizeOptions);
  }, [loadSizeOptions]);

  // Get selected item details
  const selectedItem = useMemo(() => {
    return loadSizeOptions.find(opt => opt.id === selectedOptionId)?.item || null;
  }, [loadSizeOptions, selectedOptionId]);

  // Calculate price based on selected item and express option
  const priceText = useMemo(() => {
    if (!selectedItem) return "₹0";
    // Use item-level price (from API) for tier-based pricing
    const price = isExpress ? selectedItem.express_price : selectedItem.item_price;
    return `₹${price}`;
  }, [selectedItem, isExpress]);

  // Get price for a specific option (for displaying on each tier card)
  const getOptionPrice = (option: WeightItemOption): string => {
    if (!option.item) return "₹0";
    const price = isExpress ? option.item.express_price : option.item.item_price;
    return `₹${price}`;
  };

  const handlePricingBoxLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPricingBoxDimensions({ width, height });
  };

  useEffect(() => {
    console.log("ServiceWeightOrder mounted with serviceName:", serviceName, "and vendorDetails:", vendorDetails);
    if (serviceName && vendorDetails) {
      updateServiceItems(serviceName, vendorDetails);
    }
  }, [serviceName, vendorDetails]);

  useEffect(() => {
    console.log("serviceItems :", serviceItems);
    console.log("weightItems :", weightItems);
    console.log("serviceDetails----------------", serviceDetails)
  }, [serviceItems, weightItems]);

  const handleProceed = useCallback(() => {
    if (!selectedItem) return;

    // Create OrderItem for weight-based order (quantity is 1 for weight selection)
    const price = isExpress ? selectedItem.express_price : selectedItem.item_price;
    const orderItem: OrderItem = {
      id: selectedItem.item_id,
      name: selectedItem.item_name,
      price: price,
      quantity: 1, // Weight-based orders have quantity 1
      category: weightCategory,
      service_id: serviceId || "",
      service_name: serviceName || "",
      express_price: selectedItem.express_price,
    };

    console.log("Weight order item:", orderItem);

    // Store order item in order store
    setSelectedOrderItems([orderItem]);

    navigation.navigate("OrderReview", {
      serviceType: "ServiceWeightOrder",
      serviceWeightOrderName: serviceName || "",
      serviceWeightOrderSelectedSize: selectedSize,
      serviceWeightOrderPrice: priceText,
      vendorName: vendorDetails?.shop_name || "",
      location: "-",
    });
  }, [selectedItem, isExpress, weightCategory, serviceId, serviceName, setSelectedOrderItems, navigation, selectedSize, priceText, vendorDetails]);

  // Show empty state if no weight options available
  if (loadSizeOptions.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <BackgroundGradient />
        <View style={styles.root}>
          <Toolbar title={serviceName || "Service"} />
          <View style={styles.emptyContainer}>
            <EmptyScreen
              title="No weight options available"
              subtitle="No weight options available for this service"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <View style={styles.root}>
        <Toolbar title={serviceName || "Service"} />

        {/* SLA Row */}
        <View style={styles.slaRow}>
          <TimerIcon />
          <CustomText style={styles.slaText}>{serviceDetails?.normal_delivery_time_minutes}</CustomText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Load Size Options - Tier Cards matching design mockup */}
          <View style={styles.loadSizeContainer}>
            {loadSizeOptions.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const TierIcon = option.TierIcon;
              const tierPrice = getOptionPrice(option);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.loadSizeOption,
                    isSelected && styles.loadSizeOptionSelected,
                  ]}
                  onPress={() => { setSelectedOptionId(option.id); setSelectedSize(option.size); }}
                  activeOpacity={0.7}
                >
                  {/* Radio Button */}
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>

                  {/* Tier Name and Price */}
                  <View style={styles.tierInfoContainer}>
                    <CustomText
                      style={[
                        styles.tierNameText,
                        isSelected && styles.tierNameTextSelected,
                      ]}
                    >
                      {option.tierName}
                    </CustomText>
                    <CustomText
                      style={[
                        styles.tierPriceText,
                        isSelected && styles.tierPriceTextSelected,
                      ]}
                    >
                      {tierPrice}
                    </CustomText>
                  </View>

                  {/* Tier Icon with weight range */}
                  <View style={styles.tierIconContainer}>
                    <TierIcon width={60} height={60} />
                    <CustomText style={styles.weightRangeText}>{option.weightRange}</CustomText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <CustomText style={styles.noteText}>
            Note: Select your preferred weight tier. Final bill will be based on actual weight at pickup.
          </CustomText>

        </ScrollView>

        {/* Fixed bottom section */}
        <View style={[styles.bottomBox, { paddingBottom: insets.bottom + 16 }]}>
          {/* Express Service Toggle */}
          {(serviceDetails?.is_express_available === true || vendorDetails?.services_offered?.find((service: any) => service.service_name === serviceName)?.is_express_available === true) &&
            (<View style={styles.expressRow}>
              <CustomText style={styles.expressText}>{`Express Service in ${serviceDetails?.express_time} Hours`}</CustomText>
              <CustomSwitch value={isExpress} onValueChange={() => setIsExpress(!isExpress)} />
            </View>)}

          {/* Proceed Button */}
          <CustomBtn
            title={'Proceed'}
            onPress={handleProceed}
            style={styles.proceedBtn}
            disabled={!selectedItem || loadSizeOptions.length === 0}
          />
        </View>
      </View>
    </View>
  );
};

export default ServiceWeightOrder;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'absolute', width: '100%', height: '100%'

  },
  slaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 4,
    gap: 6,
  },
  slaText: {
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 8,
  },
  pricingBox: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },
  clothesIllustration: {

    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  clothesImage: {
    width: 80,
    height: 80,
  },
  priceText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.NOTE_TEXT,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    textAlign: "left",
    fontWeight: '400',
    marginBottom: 24,
    marginTop: 8,
  },
  loadSizeContainer: {
    gap: 16,
    marginBottom: 16,
  },
  loadSizeOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    // Shadow for elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 100, // Ensure height for icons
  },
  loadSizeOptionSelected: {
    backgroundColor: COLORS.WHITE, // Keep white background? Or slightly tinted?
    borderColor: COLORS.THEME_GREEN,
    borderWidth: 1.5,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.LOGIN_SUBTITLE,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.THEME_GREEN,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.THEME_GREEN,
  },
  loadSizeText: {
    fontSize: 16,
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
  },
  loadSizeTextSelected: {
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
  },
  basketIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    opacity: 1,
  },
  basketIconUnselected: {
    opacity: 0.5,
  },
  // New tier-based styles
  tierIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    minWidth: 60,
  },
  weightRangeText: {
    fontSize: 12,
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    marginTop: 4,
    textAlign: 'center',
  },
  tierInfoContainer: {
    flex: 1,
    alignItems: "flex-start", // Left align
    justifyContent: "center",
  },
  tierNameText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    marginBottom: 4,
  },
  tierNameTextSelected: {
    color: COLORS.BOTTOM_BLACK, // Keep black unless selected style needed? Design shows black.
  },
  tierPriceText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_BOLD,
  },
  tierPriceTextSelected: {
    color: COLORS.BOTTOM_BLACK,
  },
  bottomBox: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },

  expressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: '#FFE082', // Yellow/Gold border
    backgroundColor: '#FFF9C4', // Light Yellow background
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  expressText: {
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontSize: 14,
    fontWeight: '500',
  },
  proceedBtn: {
    borderRadius: 60, // Pill shape
    backgroundColor: COLORS.THEME_GREEN,
    height: 52,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

