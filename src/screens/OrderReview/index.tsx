// ============================================================================
// IMPORTS
// ============================================================================
// React & React Native
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Third-party libraries
import { useRoute, RouteProp, useFocusEffect, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Navigation & Types
import { RootStackParamList } from "../../navigation/AppNavigator";
import { Address } from "../../types/profile/profile";
import { PlaceOrderRequest, OrderPreviewRequest } from '../../types/order/order';

// Components
import OrderReviewTopServiceItemOrder, { OrderItem } from "./OrderReviewTopServiceItemOrder";
import OrderReviewTopServiceWeightOrder from "./OrderReviewTopServiceWeightOrder";
import OrderReviewBottom from "./OrderReviewBottom";
import Toolbar from "../../components/Toolbar";
import CustomBottomSheet from "../../components/BottomSheet";
import CustomBtn from "../../components/CustomBtn";
import BillSummaryCard from "../Orders/component/BillSummaryCard";
import OrderReviewSkeleton from "./OrderReviewSkeleton";
import CustomDialog from "../../components/CustomDialog";
import CouponSection from "../../components/CouponSection";
import { CouponValidationResponse } from "../../types/offer";

// Bottom Sheets
import ServiceTypeBottomSheetContent from "./ServiceTypeBottomSheetContent";
import ChangingMobileNo from "./BottomSheets/ChangingMobileNo";
import ChangeAddress from "./BottomSheets/ChangeAddress";
import AddNote from "./BottomSheets/AddNote";

// Hooks
import { usePlaceOrder } from './hooks/usePlaceOrder';
import { useOrderPreview } from './hooks/useOrderPreview';

// Store
import { useAddressStore } from "../../state/zustand/addressStore";
import BackgroundGradient from "../../components/backgroundGradient";
import { useOrderStore } from "../../state/zustand/orderStore";

// Constants
import { COLORS } from "../../constants";
import { useProfile } from "../Profile/hooks/useProfile";
import socket from "../../services/Socket/socket";
import { showErrorToast, showSuccessToast } from "../../components/Toast/Toast";
import ErrorState from "../../components/ErrorState";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type OrderReviewRouteProp = RouteProp<RootStackParamList, "OrderReview">;
type OrderReviewNavigationProp = NativeStackNavigationProp<RootStackParamList, "OrderReview">;

interface OrderReviewProps {
	route: OrderReviewRouteProp;
	navigation: OrderReviewNavigationProp;
}

// ============================================================================
// COMPONENT
// ============================================================================
const OrderReview: React.FC<OrderReviewProps> = ({ route, navigation }) => {

	const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const insets = useSafeAreaInsets();
	// ============================================================================
	// PARAMS & EARLY RETURNS
	// ============================================================================
	const params = route.params;
	if (!params) {
		return null;
	}

	const { serviceType = "ServiceItemOrder" } = params;

	// ============================================================================
	// STATE VARIABLES
	// ============================================================================
	// Order Data State
	const [items, setItems] = useState<OrderItem[]>([]);
	const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium");
	const [serviceName, setServiceName] = useState<string>("");
	const [vendorName, setVendorName] = useState<string>("");
	const [location, setLocation] = useState<string>("");
	const {
		profile,
		getDefaultAddressWithLabel,
	} = useProfile();

	const { label, address, addressId } = getDefaultAddressWithLabel();
	// Address State
	const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(addressId);

	// Contact State
	const [contactName, setContactName] = useState(profile?.name || "");
	const [contactPhone, setContactPhone] = useState(profile?.phone || "");
	const [contactCountryCode, setContactCountryCode] = useState("+91");

	// Bottom Sheet Visibility State
	const [isBillSheetVisible, setIsBillSheetVisible] = useState(false);
	const [isChangingMobileNoSheetVisible, setIsChangingMobileNoSheetVisible] = useState(false);
	const [isChangeAddressSheetVisible, setIsChangeAddressSheetVisible] = useState(false);
	const [isAddNoteSheetVisible, setIsAddNoteSheetVisible] = useState(false);
	const [showServiceTypeBottomSheet, setShowServiceTypeBottomSheet] = useState(false);
	const [showDiscardDialog, setShowDiscardDialog] = useState(false);

	// Coupon State
	const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
	const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
	const [offerDetails, setOfferDetails] = useState<CouponValidationResponse['offer'] | null>(null);


	// ============================================================================
	// REFS
	// ============================================================================
	const isSettingItemsFromAPI = useRef(false);
	const hasAttemptedInitialLoad = useRef(false);
	const hasEverLoadedCompleteData = useRef(false);
	const lastApiCallRef = useRef<string | null>(null);
	const isSelectingServiceType = useRef(false);
	const isUpdatingFromPreviewData = useRef(false);
	const userManuallySelectedAddressRef = useRef<string | null>(null);
	const isUpdatingQuantity = useRef(false);
	const lastValidTotalBill = useRef<string>("₹0.00");
	const lastValidAddressTitle = useRef<string>("Delivery at -");

	const lastValidAddressSubtitle = useRef<string>("");
	const allowNavigationRef = useRef(false);

	// ============================================================================
	// CUSTOM HOOKS
	// ============================================================================
	const { refreshAddresses, addresses } = useAddressStore();
	const {
		vendorDetails,
		selectedOrderItems,
		setSelectedOrderItems,
		clearAll,
		setIsExpress,
		isExpress,
		note: storedNote,
		setNote: setStoredNote,
	} = useOrderStore();
	const [express, setExpress] = useState(isExpress);
	const [pendingExpress, setPendingExpress] = useState(isExpress);
	const [note, setNoteState] = useState<string>(storedNote || "");

	// Sync local note with store (e.g., after discard clearing store state)
	useEffect(() => {
		setNoteState(storedNote || "");
	}, [storedNote]);

	const { isLoading, error, message, orderData, placeOrder, isSuccess } = usePlaceOrder();
	const {
		isLoading: isPreviewLoading,
		error: previewError,
		previewData,
		getOrderPreview,
		message: previewMessage,
	} = useOrderPreview();

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================
	const formatAddress = (addr: Address): string => {
		const parts = [
			addr.address_line1,
			addr.address_line2,
			addr.city,
			addr.state,
			addr.pincode,
		].filter(Boolean);
		return parts.join(', ');
	};


	const previewRequest = useMemo<OrderPreviewRequest | null>(() => {
		if (!selectedAddressId || !vendorDetails?.id) return null;

		const itemsToUse = selectedOrderItems || items || [];
		if (itemsToUse.length === 0) return null;

		return {
			pickup_address_id: selectedAddressId,
			vendor_id: vendorDetails.id,
			service_items: itemsToUse.map(item => ({
				service_id: item.service_id,
				service_name: item.service_name || serviceName,
				item_id: item.id,
				item_name: item.name,
				quantity: item.quantity,
			})),
			is_express: express,
			order_notes: note || undefined,
		};
	}, [
		selectedAddressId,
		vendorDetails?.id,
		selectedOrderItems,
		items,
		express,
		note,
		serviceName,
	]);

	// Helper function to check if items are actually different
	const areItemsEqual = (items1: OrderItem[], items2: OrderItem[]): boolean => {
		if (items1.length !== items2.length) return false;
		return items1.every((item1, index) => {
			const item2 = items2[index];
			return item1.id === item2.id &&
				item1.quantity === item2.quantity &&
				item1.price === item2.price &&
				item1.service_id === item2.service_id;
		});
	};

	const prepareServiceItems = useCallback((itemsToPrepare: OrderItem[]) => {
		return itemsToPrepare.map((item) => ({
			service_id: item.service_id,
			service_name: item.service_name || serviceName,
			item_id: item.id,
			item_name: item.name,
			quantity: item.quantity
		}));
	}, [serviceName]);

	const prepareOrderRequest = useCallback((itemsToUse: OrderItem[]): OrderPreviewRequest | null => {
		if (!selectedAddressId || !vendorDetails?.id || itemsToUse.length === 0) {
			return null;
		}

		const service_items = prepareServiceItems(itemsToUse);


		return {
			pickup_address_id: selectedAddressId,
			vendor_id: vendorDetails.id,
			service_items: service_items,
			is_express: express,
			order_notes: note || undefined
		};
	}, [selectedAddressId, vendorDetails?.id, express, note, prepareServiceItems]);

	// Extract stable address values
	const previewAddressLabel = previewData?.vendor?.pickup_address?.label;
	const selectedAddressLabel = selectedAddress?.label;

	const getAddressTitle = useMemo(() => {
		// If we have valid preview data, use it and store it
		if (previewAddressLabel) {
			const newTitle = `Delivery at ${previewAddressLabel}`;
			lastValidAddressTitle.current = newTitle;
			return newTitle;
		}
		// During API calls, show last valid value
		if (isPreviewLoading && lastValidAddressTitle.current !== "Delivery at -") {
			return lastValidAddressTitle.current;
		}
		// Fallback to selectedAddress
		if (selectedAddress) {
			const fallbackTitle = `Delivery at ${selectedAddressLabel || 'Other'}`;
			// Only update stored value if we don't have a valid one yet
			if (lastValidAddressTitle.current === "Delivery at -") {
				lastValidAddressTitle.current = fallbackTitle;
			}
			return fallbackTitle;
		}
		return lastValidAddressTitle.current || "Delivery at -";
	}, [previewAddressLabel, selectedAddress, selectedAddressLabel, isPreviewLoading]);

	// Extract stable preview address
	const previewPickupAddress = previewData?.vendor?.pickup_address;

	const getAddressSubtitle = useMemo(() => {
		// If we have valid preview data, use it and store it
		if (previewPickupAddress) {
			const addr = previewPickupAddress;
			const parts = [
				addr.address_line1,
				addr.address_line2,
				addr.city,
				addr.state,
				addr.pincode,
			].filter(Boolean);
			const formatted = parts.join(', ');
			const displaySubtitle = formatted.length > 30 ? formatted.substring(0, 30) + '...' : formatted;
			lastValidAddressSubtitle.current = displaySubtitle;
			return displaySubtitle;
		}
		// During API calls, show last valid value
		if (isPreviewLoading && lastValidAddressSubtitle.current !== "") {
			return lastValidAddressSubtitle.current;
		}
		// Fallback to selectedAddress
		if (selectedAddress) {
			const formatted = formatAddress(selectedAddress);
			const displaySubtitle = formatted.length > 30 ? formatted.substring(0, 30) + '...' : formatted;
			// Only update stored value if we don't have a valid one yet
			if (lastValidAddressSubtitle.current === "") {
				lastValidAddressSubtitle.current = displaySubtitle;
			}
			return displaySubtitle;
		}
		return lastValidAddressSubtitle.current || "";
	}, [previewPickupAddress, selectedAddress, isPreviewLoading]);

	// Extract stable pricing reference (moved before useMemo that uses it)
	const previewPricing = previewData?.vendor?.pricing;
	const pricingTotalPayable = previewPricing?.total_payable_amount;

	const calculateTotalBill = useMemo(() => {
		// If we have valid preview data, use it and store it
		if (pricingTotalPayable !== undefined) {
			const newTotal = `₹${pricingTotalPayable.toFixed(2)}`;
			lastValidTotalBill.current = newTotal;
			return newTotal;
		}
		// During API calls (when previewData is null/updating), show last valid value
		if (isPreviewLoading && lastValidTotalBill.current !== "₹0.00") {
			return lastValidTotalBill.current;
		}
		// Fallback calculation only if we don't have a stored value
		if (items.length > 0) {
			const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
			const calculatedTotal = `₹${subtotal.toFixed(2)}`;
			// Only update stored value if we don't have a valid one yet
			if (lastValidTotalBill.current === "₹0.00") {
				lastValidTotalBill.current = calculatedTotal;
			}
			return calculatedTotal;
		}
		return lastValidTotalBill.current || "₹0.00";
	}, [pricingTotalPayable, items, isPreviewLoading]);

	const calculatePlaceOrderAmount = useMemo(() => {
		// If we have valid preview data, use it
		if (pricingTotalPayable !== undefined) {
			return `₹ ${pricingTotalPayable.toFixed(2)}`;
		}
		// During API calls, use the last valid total bill (remove extra space for consistency)
		if (isPreviewLoading && lastValidTotalBill.current !== "₹0.00") {
			return lastValidTotalBill.current.replace("₹", "₹ ");
		}
		// Fallback calculation
		if (items.length > 0) {
			const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
			return `₹ ${subtotal.toFixed(2)}`;
		}
		return lastValidTotalBill.current.replace("₹", "₹ ") || "₹ 0.00";
	}, [pricingTotalPayable, items, isPreviewLoading]);

	// Extract stable preview items reference
	const previewItems = previewData?.vendor?.items;
	const previewItemsLength = previewItems?.length || 0;

	// Memoize items mapping from preview data with stable dependencies
	const mappedItemsFromPreview = useMemo(() => {
		if (!previewItems || previewItemsLength === 0) return [];
		return previewItems.map(item => {
			const originalItem = selectedOrderItems?.find(soi => soi.id === item.item_id);
			return {
				id: item.item_id,
				name: item.item_name,
				price: item.price_per_item,
				express_price: originalItem?.express_price || item.price_per_item,
				quantity: item.quantity,
				category: originalItem?.category || "",
				service_id: item.service_id,
				service_name: item.service_name,
			};
		});
	}, [previewItems, previewItemsLength, selectedOrderItems]);

	// Extract stable preview values
	const previewVendorName = previewData?.vendor?.shop_name;
	const vendorShopName = vendorDetails?.shopName;

	// Memoize vendor name with stable dependencies
	const displayVendorName = useMemo(() => {
		return vendorName || previewVendorName || vendorShopName || "";
	}, [vendorName, previewVendorName, vendorShopName]);

	// Memoize service name with stable dependencies
	const displayServiceName = useMemo(() => {
		return serviceName || previewData?.vendor?.items?.[0]?.service_name || "";
	}, [serviceName, previewData?.vendor?.items]);

	// Memoize bill items for bottom sheet with stable dependencies
	const billItems = useMemo(() => {
		if (previewData?.vendor?.pricing) {
			const paymentBreakDown = previewData.vendor.payment_breakdown;
			return [
				{ label: 'Item Total', amount: paymentBreakDown.item_total },
				{ label: 'Delivery Fee', amount: paymentBreakDown.delivery_fee },
				{ label: 'Platform Fee', amount: paymentBreakDown.amount_to_platform },
				{ label: 'GST', amount: paymentBreakDown.gst },
			];
		}
		return [
			{ label: 'Item Total', amount: 0.0 },
			{ label: 'Delivery Fee', amount: 0 },
			{ label: 'Platform Fee', amount: 0 },
			{ label: 'GST', amount: 0.00 },
		];
	}, [previewData?.vendor?.pricing]);

	// Memoize cash round off with stable dependencies
	const cashRoundOff = useMemo(() => {
		if (pricingTotalPayable !== undefined) {
			return pricingTotalPayable - Math.floor(pricingTotalPayable);
		}
		return 0.00;
	}, [pricingTotalPayable]);

	// Memoize to pay amount with stable dependencies
	const toPayAmount = useMemo(() => {
		if (pricingTotalPayable !== undefined) {
			return Math.floor(pricingTotalPayable);
		}
		return 0;
	}, [pricingTotalPayable]);

	// Memoize contact info object
	const contactInfo = useMemo(() => ({
		name: contactName,
		number: contactPhone
	}), [contactName, contactPhone]);

	// Memoize location object
	const locationData = useMemo(() => {
		return label ? { label: label, address: address } : undefined;
	}, [label, address]);




	// ============================================================================
	// EFFECTS
	// ============================================================================
	// Refresh addresses when screen comes into focus

	// Sync local express state with store's isExpress only when not in bottom sheet selection mode
	// This prevents premature updates when user is just selecting in the bottom sheet
	useEffect(() => {
		// Don't sync if we're updating from previewData to prevent infinite loops
		if (isUpdatingFromPreviewData.current) {
			return;
		}
		// Only sync if we're not in the middle of selecting (i.e., bottom sheet is closed)
		if (!showServiceTypeBottomSheet && !isSelectingServiceType.current) {
			// Only update if the value is actually different to prevent unnecessary re-renders
			if (express !== isExpress) {
				setExpress(isExpress);
			}
		}
	}, [isExpress, showServiceTypeBottomSheet, express]);

	// Initial sync on mount
	useEffect(() => {
		console.log("Initial sync of express state", isExpress);
		setExpress(isExpress);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			refreshAddresses();
		}, [refreshAddresses])
	);

	// Remove back navigation dialog/popup - allow direct back navigation
	// This prevents any confirmation dialog when user presses back button or swipes back
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', (e) => {
			if (allowNavigationRef.current || previewError) {
				// Allow navigation
				return;
			}

			if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
				e.preventDefault();
				setShowDiscardDialog(true);
			}
		});

		return unsubscribe;
	}, [navigation, previewError]);

	// Initialize with default address on mount
	useEffect(() => {
		if (addresses.length > 0 && !selectedAddressId) {
			const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
			if (defaultAddress) {
				setSelectedAddress(defaultAddress);
				setSelectedAddressId(defaultAddress._id);
			}
		}
	}, [addresses, selectedAddressId]);

	// Refresh addresses when bottom sheet opens
	useEffect(() => {
		if (isChangeAddressSheetVisible) {
			refreshAddresses();
		}
	}, [isChangeAddressSheetVisible, refreshAddresses]);

	// Populate ALL UI data from preview API response when it's received
	useEffect(() => {
		if (previewData) {
			// Mark that we're updating from previewData to prevent infinite loops
			isUpdatingFromPreviewData.current = true;

			// Batch state updates to reduce re-renders
			const updates: Array<() => void> = [];

			// Update vendor information (only if changed)
			if (previewData.vendor) {
				if (vendorName !== previewData.vendor.shop_name) {
					updates.push(() => setVendorName(previewData.vendor!.shop_name));
				}
				const newLocation = previewData.vendor.address?.city || "";
				if (location !== newLocation) {
					updates.push(() => setLocation(newLocation));
				}
			}

			// Update express status from API response
			if (previewData.vendor?.is_express !== undefined) {
				// Only update if the value is actually different to prevent unnecessary re-renders
				if (express !== previewData.vendor.is_express) {
					updates.push(() => setExpress(previewData.vendor.is_express));
				}
				// Also sync to store to keep it in sync, but only if different to prevent loops
				if (isExpress !== previewData.vendor.is_express) {
					updates.push(() => setIsExpress(previewData.vendor.is_express));
				}
			}

			// Update note if available (only if changed)
			if (previewData.vendor?.order_notes !== undefined) {
				if (note !== previewData.vendor.order_notes) {
					updates.push(() => {
						setNoteState(previewData.vendor!.order_notes || "");
						setStoredNote(previewData.vendor!.order_notes || "");
					});
				}
			}

			// Update items from preview API response with correct pricing
			if (previewData.vendor?.items && previewData.vendor.items.length > 0) {
				const categoryMap = new Map<string, string>();
				const expressPriceMap = new Map<string, number>();
				if (selectedOrderItems) {
					selectedOrderItems.forEach(item => {
						categoryMap.set(item.id, item.category);
						expressPriceMap.set(item.id, item.express_price);
					});
				}

				const updatedItems: OrderItem[] = previewData.vendor.items.map((previewItem) => {
					const category = categoryMap.get(previewItem.item_id) || "";
					const expressPrice = expressPriceMap.get(previewItem.item_id) || previewItem.price_per_item;

					return {
						id: previewItem.item_id,
						name: previewItem.item_name,
						price: previewItem.price_per_item,
						express_price: expressPrice,
						quantity: previewItem.quantity,
						category: category,
						service_id: previewItem.service_id,
						service_name: previewItem.service_name,
					} as OrderItem;
				});

				isSettingItemsFromAPI.current = true;

				// Only update items if they actually changed to prevent infinite loops
				if (!areItemsEqual(items, updatedItems)) {
					updates.push(() => setItems(updatedItems));
				}

				// Update the store with new items to keep data in sync, but only if different
				if (!selectedOrderItems || !areItemsEqual(selectedOrderItems, updatedItems)) {
					updates.push(() => setSelectedOrderItems(updatedItems));
				}

				if (updatedItems.length > 0 && updatedItems[0].service_name) {
					if (serviceName !== updatedItems[0].service_name) {
						updates.push(() => setServiceName(updatedItems[0].service_name));
					}
				}

				setTimeout(() => {
					isSettingItemsFromAPI.current = false;
				}, 0);
			}

			// Update selected address from preview (only if different to prevent loops)
			if (previewData.vendor?.pickup_address) {
				const previewAddr = previewData.vendor.pickup_address;
				// Don't override if user just manually selected a different address
				if (userManuallySelectedAddressRef.current && userManuallySelectedAddressRef.current !== previewAddr._id) {
					// User manually selected a different address, don't override it
					// Clear the ref after checking to allow future updates
					userManuallySelectedAddressRef.current = null;
					// Execute batched updates before returning
					updates.forEach(update => update());
					return;
				}
				// Only update if the address ID is different to prevent unnecessary updates
				if (selectedAddressId !== previewAddr._id) {
					const matchingAddress = addresses.find(addr => addr._id === previewAddr._id);
					if (matchingAddress) {
						updates.push(() => {
							setSelectedAddress(matchingAddress);
							setSelectedAddressId(matchingAddress._id);
						});
					} else {
						const addressFromPreview: Address = {
							label: previewAddr.label,
							address_line1: previewAddr.address_line1,
							address_line2: previewAddr.address_line2 || "",
							city: previewAddr.city || "",
							state: previewAddr.state || "",
							pincode: previewAddr.pincode,
							latitude: previewAddr.latitude,
							longitude: previewAddr.longitude,
							is_default: previewAddr.is_default,
							_id: previewAddr._id
						};
						updates.push(() => {
							setSelectedAddress(addressFromPreview);
							setSelectedAddressId(previewAddr._id);
						});
					}
				}
				// Clear the ref if the preview matches the manual selection
				if (userManuallySelectedAddressRef.current === previewAddr._id) {
					userManuallySelectedAddressRef.current = null;
				}
			}

			// Mark that we've successfully loaded complete data
			if (previewData.vendor?.items && previewData.vendor.items.length > 0 &&
				previewData.vendor && previewData.vendor.pickup_address) {
				hasEverLoadedCompleteData.current = true;
			}

			// Update last valid total bill when we receive new preview data
			if (previewData.vendor?.pricing?.total_payable_amount) {
				lastValidTotalBill.current = `₹${previewData.vendor.pricing.total_payable_amount.toFixed(2)}`;
			}

			// Update last valid address title and subtitle when we receive new preview data
			if (previewData.vendor?.pickup_address?.label) {
				lastValidAddressTitle.current = `Delivery at ${previewData.vendor.pickup_address.label}`;
			}
			if (previewData.vendor?.pickup_address) {
				const addr = previewData.vendor.pickup_address;
				const parts = [
					addr.address_line1,
					addr.address_line2,
					addr.city,
					addr.state,
					addr.pincode,
				].filter(Boolean);
				const formatted = parts.join(', ');
				lastValidAddressSubtitle.current = formatted.length > 30 ? formatted.substring(0, 30) + '...' : formatted;
			}

			// Execute all batched updates together to reduce re-renders
			updates.forEach(update => update());

			// Reset the flag after a short delay to allow state updates to complete
			setTimeout(() => {
				isUpdatingFromPreviewData.current = false;
				// Also reset quantity update flag when preview data is received
				isUpdatingQuantity.current = false;
			}, 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [previewData]);

	// Serialize selectedOrderItems to track quantity changes
	const selectedOrderItemsKey = useMemo(() => {
		if (!selectedOrderItems || selectedOrderItems.length === 0) return '';
		return JSON.stringify(selectedOrderItems.map(item => ({
			id: item.id,
			quantity: item.quantity,
			service_id: item.service_id
		})));
	}, [selectedOrderItems]);

	const fetchOrderPreviewDebounced = useCallback(
		(req: OrderPreviewRequest) => {
			if (previewTimeoutRef.current) {
				clearTimeout(previewTimeoutRef.current);
			}
			console.log("fetchOrderPreviewDebounced-----", req);
			previewTimeoutRef.current = setTimeout(() => {
				getOrderPreview(req);
			}, 400);
		},
		[getOrderPreview]
	);

	useEffect(() => {
		if (!previewRequest) return;
		if (isUpdatingFromPreviewData.current) return;
		if (isSelectingServiceType.current) return;

		const requestKey = JSON.stringify(previewRequest);

		if (
			lastApiCallRef.current === requestKey &&
			hasAttemptedInitialLoad.current
		) {
			return;
		}

		lastApiCallRef.current = requestKey;
		hasAttemptedInitialLoad.current = true;

		fetchOrderPreviewDebounced(previewRequest);
	}, [previewRequest, fetchOrderPreviewDebounced]);




	// Show toast message when preview error occurs
	useEffect(() => {
		if (previewError) {
			showErrorToast(previewError);
		}
	}, [previewError]);

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================
	const handleItemQuantityChange = useCallback((itemId: string, quantity: number) => {
		// Mark that we're updating quantity to suppress shimmer
		isUpdatingQuantity.current = true;

		// If quantity is below 1, remove the item from the list
		if (quantity < 1) {
			setItems((prev) => {
				const filtered = prev.filter((item) => item.id !== itemId);
				// If no items remain, go back
				if (filtered.length === 0) {
					navigation.goBack();
					clearAll();
					return prev;
				}
				setSelectedOrderItems(filtered);
				return filtered;
			});
			return;
		}

		setItems((prev) => {
			const updated = prev.map((item) => (item.id === itemId ? { ...item, quantity } : item));
			setSelectedOrderItems(updated);
			return updated;
		});
	}, [setSelectedOrderItems, navigation]);

	const handleBillPress = useCallback(() => {
		setIsBillSheetVisible(true);
	}, []);

	const handleCloseAddNoteSheet = useCallback(() => {
		setIsAddNoteSheetVisible(false);
	}, []);



	const handleNoteSubmit = useCallback((noteText: string) => {
		setNoteState(noteText);
		setStoredNote(noteText);

		lastApiCallRef.current = null;
		hasAttemptedInitialLoad.current = false;

		setIsAddNoteSheetVisible(false);
	}, [setStoredNote]);

	const handleCloseBillSheet = useCallback(() => {
		setIsBillSheetVisible(false);
	}, []);

	// Coupon Handlers
	const handleCouponApplied = useCallback((
		code: string,
		discountAmount: number,
		offer?: CouponValidationResponse['offer']
	) => {
		setAppliedCouponCode(code);
		setAppliedDiscount(discountAmount);
		setOfferDetails(offer || null);
	}, []);

	const handleCouponRemoved = useCallback(() => {
		setAppliedCouponCode(null);
		setAppliedDiscount(0);
		setOfferDetails(null);
	}, []);

	const handleCloseChangeAddressSheet = useCallback(() => {
		setIsChangeAddressSheetVisible(false);
	}, []);

	const handleCloseChangingMobileNoSheet = useCallback(() => {
		setIsChangingMobileNoSheetVisible(false);
	}, []);

	const handleAddressSelect = useCallback((address: Address, selectedId: string) => {
		setSelectedAddress(address);
		setSelectedAddressId(selectedId);
		// Track that user manually selected this address to prevent preview data from overriding it
		userManuallySelectedAddressRef.current = selectedId;
	}, []);


	const handleChangeAddressPress = useCallback(() => {
		setIsChangeAddressSheetVisible(true);
	}, []);

	const handleChangingMobileNoPress = useCallback(() => {
		setIsChangingMobileNoSheetVisible(true);
	}, []);

	const handleContactInfoSubmit = useCallback((name: string, countryCode: string, number: string) => {
		setContactName(name);
		setContactPhone(number);
		setContactCountryCode(countryCode);
		setIsChangingMobileNoSheetVisible(false);
	}, []);


	const handleRefreshOrderPreview = useCallback((addressId: string) => {
		setSelectedAddressId(addressId);
		userManuallySelectedAddressRef.current = addressId;

		// 🔥 force preview refresh
		lastApiCallRef.current = null;
		hasAttemptedInitialLoad.current = false;
	}, []);


	const handleGoBack = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const handleToolbarBack = useCallback(() => {
		if (previewError) {
			navigation.goBack();
			return;
		}
		setShowDiscardDialog(true);
	}, [previewError, navigation]);

	const handleAddNote = useCallback(() => {
		setIsAddNoteSheetVisible(true);
	}, []);

	const handleOfferPress = useCallback(() => {
		// Handle offer press if needed
	}, []);

	const handleLocationPress = useCallback(() => {
		// Handle location press if needed
	}, []);

	const handleExpressPress = useCallback(() => {
		// Start bottom sheet with current committed express value
		setPendingExpress(express);
		isSelectingServiceType.current = true;
		setShowServiceTypeBottomSheet(true);
	}, [express]);

	const handleConfirmServiceType = useCallback(() => {
		const newExpressValue = pendingExpress;

		setExpress(newExpressValue);
		setIsExpress(newExpressValue);

		setShowServiceTypeBottomSheet(false);
		isSelectingServiceType.current = false;

		// 🔥 force preview refresh
		lastApiCallRef.current = null;
		hasAttemptedInitialLoad.current = false;
	}, [pendingExpress, setIsExpress]);


	const handleCloseBottomSheet = useCallback(() => {
		// Just close; do not change committed express value
		isSelectingServiceType.current = false;
		setShowServiceTypeBottomSheet(false);
	}, []);

	const handleServiceTypeSelect = useCallback((isExpressValue: boolean) => {
		// Update only the pending value while bottom sheet is open
		setPendingExpress(isExpressValue);
	}, []);



	const handleDiscardConfirm = useCallback(() => {
		allowNavigationRef.current = true;
		setShowDiscardDialog(false);
		clearAll();
		navigation.goBack();
	}, [clearAll, navigation]);

	const handleDiscardClose = useCallback(() => {
		setShowDiscardDialog(false);
	}, []);

	const handlePlaceOrder = async () => {
		const requestData = prepareOrderRequest(items);
		if (!requestData) {
			showErrorToast("This vendor is currently out of your service range. Please select another shop.");
			return;
		}


		await socket.connect().catch(err => {
			console.error('Failed to connect socket:', err)
			return null;
		});

		const orderRequest: PlaceOrderRequest = {
			pickup_address_id: requestData.pickup_address_id,
			vendor_id: requestData.vendor_id,
			service_items: requestData.service_items,
			is_express: requestData.is_express,
			order_notes: requestData?.order_notes || '',
			offer_code: appliedCouponCode || undefined,
		};

		const orderResponse = await placeOrder(orderRequest);


		if (orderResponse) {
			allowNavigationRef.current = true;
			clearAll();
			// Small delay to let UI settle before navigating
			setTimeout(() => {
				// Navigate to ActiveOrderScreen with MainTabs as the base
				// This ensures the back button works properly
				navigation.dispatch(
					CommonActions.reset({
						index: 1,
						routes: [
							{ name: "MainTabs" },
							{ name: "ActiveOrderScreen", params: { orderId: orderResponse?.data?.order_id || "" } }
						],
					})
				);
			}, 300);
		}
	};

	// ============================================================================
	// RENDER LOGIC
	// ============================================================================
	const hasCompletePreviewData = !!(
		previewData &&
		previewData.vendor?.items &&
		previewData.vendor.items.length > 0 &&
		previewData.vendor &&
		previewData.vendor.pickup_address
	);

	// Show skeleton while loading or until we have complete data
	// Don't show skeleton if there's an error (even if we don't have complete data)
	// Don't show skeleton when updating quantity (increment/decrement)
	const shouldShowSkeleton = (isPreviewLoading || (!hasEverLoadedCompleteData.current && !previewError)) && !isUpdatingQuantity.current;

	// ============================================================================
	// RENDER
	// ============================================================================
	if (shouldShowSkeleton) {
		return (
			<View style={{ flex: 1 }}>
				<BackgroundGradient />
				<View style={styles.root}>
					<Toolbar
						title=""
						showLocation={true}
						location={locationData}
						onLocationPress={handleLocationPress}
						onBackPress={handleToolbarBack}
					/>

					<ScrollView
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}
					>
						<OrderReviewSkeleton />
					</ScrollView>
				</View>
			</View>
		);
	}

	if (previewError) {
		return (
			<View style={{ flex: 1 }}>
				<BackgroundGradient />
				<View style={styles.root}>
					<Toolbar
						title="Order Detail"
						showLocation={false}
						onBackPress={handleToolbarBack}
					/>
					<ErrorState
						message={previewMessage || 'Failed to get order preview'}
						onRetry={handleToolbarBack}
						retryButtonText="Back"
					/>
				</View>
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<BackgroundGradient />
			<View style={styles.root}>
				{/* Header */}
				<Toolbar
					title={displayVendorName}
					showLocation={true}
					location={locationData}
					onLocationPress={handleLocationPress}
					onBackPress={handleToolbarBack}
				/>

				{/* Scrollable Content */}
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					{/* Top Component - Conditional based on service type */}
					{serviceType === "ServiceItemOrder" ? (
						<OrderReviewTopServiceItemOrder
							serviceName={displayServiceName}
							items={items.length > 0 ? items : mappedItemsFromPreview}
							vendorDetails={previewData?.vendor}
							express={express}
							onExpressChange={setExpress}
							onAddMore={handleGoBack}
							onItemQuantityChange={handleItemQuantityChange}
						/>
					) : (
						<OrderReviewTopServiceWeightOrder
							vendorDetails={previewData?.vendor}
							serviceName={displayServiceName}
							selectedSize={selectedSize}
							price={previewItems?.[0]?.price_per_item?.toString() || "0"}
							express={express}
							onExpressChange={setExpress}
							onEdit={handleGoBack}
							onLoadSizeChange={setSelectedSize}
						/>
					)}

					{/* Bottom Component - Common for both */}
					<OrderReviewBottom
						onAddNote={handleAddNote}
						vendorDetails={previewData?.vendor}
						onOfferPress={handleOfferPress}
						onExpressPress={handleExpressPress}
						onDeliveryAddressPress={handleChangeAddressPress}
						onContactPress={handleChangingMobileNoPress}
						onTotalBillPress={handleBillPress}
						totalBill={calculateTotalBill}
						contactInfo={contactInfo}
						deliveryAddressTitle={getAddressTitle}
						deliveryAddressSubtitle={getAddressSubtitle}
						note={previewData?.vendor?.order_notes || note}
						pricing={previewData?.vendor?.pricing}
						isWeightBased={serviceType === "ServiceItemOrder"}
					/>

					{/* Coupon Section */}
					<CouponSection
						orderSubtotal={previewData?.vendor?.pricing?.subtotal || 0}
						serviceIds={items.map(item => item.service_id)}
						onCouponApplied={handleCouponApplied}
						onCouponRemoved={handleCouponRemoved}
						appliedCouponCode={appliedCouponCode || undefined}
						appliedDiscount={appliedDiscount}
					/>
				</ScrollView>

				{/* Fixed Place Order Button at Bottom */}
				<View style={[styles.fixedButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
					<CustomBtn
						title={serviceType === "ServiceItemOrder" ? `Place Order ${calculatePlaceOrderAmount}` : `Place Order`}
						onPress={handlePlaceOrder}
						style={styles.placeOrderBtn}
						loading={isLoading}
						disabled={isLoading}
					/>
				</View>

				{/* Service Type Bottom Sheet */}
				<CustomBottomSheet
					isVisible={showServiceTypeBottomSheet}
					onClose={handleCloseBottomSheet}
					bgColor={COLORS.WHITE}
					dismissible={true}
				>
					<ServiceTypeBottomSheetContent
						deliveryTime={{
							standard: previewData?.vendor?.standard_delivery_time || "",
							express: previewData?.vendor?.express_delivery_time || ""
						}}
						express={pendingExpress}
						onSelect={handleServiceTypeSelect}
						onConfirm={handleConfirmServiceType}
					/>
				</CustomBottomSheet>

				{/* Change Address Bottom Sheet */}
				<CustomBottomSheet
					isVisible={isChangeAddressSheetVisible}
					onClose={handleCloseChangeAddressSheet}
					bgColor="#fff"
					dismissible={true}
				>
					<ChangeAddress
						onSelectAddress={handleAddressSelect}
						onClose={handleCloseChangeAddressSheet}
						selectedAddressId={selectedAddress?._id}
						distanceMap={previewData?.vendor?.distance_map || []}
						onRefreshOrderPreview={handleRefreshOrderPreview}
					/>
				</CustomBottomSheet>

				{/* Add Note Bottom Sheet */}
				<CustomBottomSheet
					isVisible={isAddNoteSheetVisible}
					onClose={handleCloseAddNoteSheet}
					bgColor="#fff"
					dismissible={true}
				>
					<AddNote
						onSubmit={handleNoteSubmit}
						onCancel={handleCloseAddNoteSheet}
						initialNote={note}
					/>
				</CustomBottomSheet>

				{/* Bill Summary Bottom Sheet */}
				<CustomBottomSheet
					isVisible={isBillSheetVisible}
					onClose={handleCloseBillSheet}
					bgColor="#fff"
					dismissible={true}
				>
					<BillSummaryCard
						isWhiteBackground={true}
						subtitle="Incl. All taxes & Charges"
						billItems={billItems}
						grandTotal={previewData?.vendor?.payment_breakdown?.grand_total || 0.0}
						offer={previewData?.vendor?.payment_breakdown?.offerDiscountAmount || 0}
						cashRoundOff={cashRoundOff}
						toPay={previewData?.vendor?.payment_breakdown?.totalPayableAmount || 0.0}
					/>
				</CustomBottomSheet>

				{/* Changing Mobile No Bottom Sheet */}
				<CustomBottomSheet
					isVisible={isChangingMobileNoSheetVisible}
					onClose={handleCloseChangingMobileNoSheet}

					bgColor="#fff"
					dismissible={true}
				>
					<ChangingMobileNo
						initialName={contactName}
						initialNumber={contactPhone}
						initialCountryCode={contactCountryCode}
						onSubmit={handleContactInfoSubmit}
						onCancel={handleCloseChangingMobileNoSheet}
					/>
				</CustomBottomSheet>

				<CustomDialog
					visible={showDiscardDialog}
					title="Discard Changes"
					content="Are you sure you want to discard the selected items?"
					onClose={handleDiscardClose}
					onConfirm={handleDiscardConfirm}
					confirmText="Discard"
					cancelText="No"
				/>
			</View>
		</View>
	);
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
	root: {
		flex: 1, position: 'absolute', width: '100%', height: '100%'

	},
	scrollContent: {
		paddingBottom: 100,
		marginHorizontal: 12,
		marginTop: 12,
	},
	fixedButtonContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16,
		backgroundColor: COLORS.WHITE,
	},
	placeOrderBtn: {
		borderRadius: 12,
	},
});

export default OrderReview;