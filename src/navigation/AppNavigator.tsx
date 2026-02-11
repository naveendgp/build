// src/navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { setNavigationRef } from "../utils/sessionHandler";
import SplashScreen from "../screens/Splash";
import OnBoardingScreen from "../screens/OnBoarding";
import LoginScreen from "../screens/Auth/Login";
import OTPVerificationScreen from "../screens/Auth/OTPVerification";
import BottomMainNavigator from "./BottomMainNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HomeScreen } from "../screens/Home/HomeScreen";
import VendorDetail from "../screens/VendorDetail";
import ServiceList from "../screens/ServiceList/serviceList";
import ProfileDataScreen from "../screens/Auth/ProfileData";
import ProfileLocation from "../screens/Auth/ProfileData/ProfileLocation";
import DebugMap from "../screens/Auth/ProfileData/map/DebugMap";
import NotificationScreen from "../screens/Profile/SubScreens/NotificationScreen";
import ServiceItemOrder from "../screens/VendorDetail/Services/ServiceItemOrder";
import ServiceWeightOrder from "../screens/VendorDetail/Services/ServiceWeightOrder";
import OrderReview from "../screens/OrderReview";
import CompletedOrderDetailsScreen from "../screens/Orders/completedOrder";
import ActiveOrderScreen from "../screens/Orders/ActiveOrder";
import InvoiceScreen from "../screens/InvoiceScreen";
import PaymentScreen from "../screens/Orders/Payment/PaymentScreen";
import WebViewScreen from "../screens/Profile/components/WebViewScreen";
import CustomToast from "../components/Toast/CustomToast";
import { Vendor, VendorService } from "../types/vendor/vendorDetail";

export type RootStackParamList = {
  Splash: undefined;
  OnBoarding: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { mobile: string; isRegister?: boolean };
  MainTabs: undefined;
  HomeScreen: undefined;
  OrderConfirmation: undefined;
  OrdersDrawerScreen: undefined;
  Orders: undefined;
  UserProfile: undefined;
  NotificationList: undefined;
  VendorDetail: { vendorId?: string; selectedFilterId?: string } | undefined;
  ProfileDataScreen: { hideContinue?: boolean; fromOtp?: boolean; phoneNumber?: string } | undefined;
  ProfileLocation: {
    onSelect?: (data: any) => void;
    isEditMode?: boolean;
    addressId?: string;
    addressData?: {
      addressId: string;
      label: string;
      address_line1?: string;
      address_line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number;
      longitude?: number;
      is_default?: boolean;
      formattedAddress?: string;
    };
  } | undefined;
  ServiceList: undefined;
  ServiceItemOrder: { serviceName: string; vendorDetails: Vendor | null, tabCategories: string[], serviceId: string, maxCountPerItem?: number };
  ServiceWeightOrder: { serviceName: string, serviceImage: string, vendorDetails: any, tabCategories: string[], serviceId: string, serviceDetails?: VendorService | null };
  OrderReview: {
    serviceType: "ServiceItemOrder" | "ServiceWeightOrder";
    vendorName?: string;
    location?: string;
    serviceItemOrderName?: string;
    serviceItemOrderItems?: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      category: string;
    }>;
    serviceWeightOrderName?: string;
    serviceWeightOrderSelectedSize?: "small" | "medium" | "large";
    serviceWeightOrderPrice?: string;
  } | undefined;
  CompletedOrderDetailsScreen: { orderId?: string } | undefined;
  ActiveOrderScreen: { orderId: string };
  InvoiceScreen: undefined;
  NotificationScreen: undefined;
  PaymentScreen: { paymentUrl: string; orderId?: string };
  WebViewScreen: { url: string; title?: string };

};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer
      ref={(ref) => {
        if (ref) {
          setNavigationRef(ref as any);
        }
      }}
    >
      <Stack.Navigator
        // initialRouteName="DebugMap"
        initialRouteName="Splash"

      >
        {/* <Stack.Screen
          name="DebugMap"
          component={DebugMap}
          options={{ headerShown: false }}
        /> */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OnBoarding"
          component={OnBoardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="OTPVerification"
          component={OTPVerificationScreen}
        />
        <Stack.Screen
          name="MainTabs"
          component={BottomMainNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VendorDetail"
          component={VendorDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileDataScreen"
          component={ProfileDataScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileLocation"
          component={ProfileLocation}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ServiceList"
          component={ServiceList} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ServiceItemOrder"
          component={ServiceItemOrder}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ServiceWeightOrder"
          component={ServiceWeightOrder}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderReview"
          component={OrderReview}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CompletedOrderDetailsScreen"
          component={CompletedOrderDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ActiveOrderScreen"
          component={ActiveOrderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationScreen"
          component={NotificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PaymentScreen"
          component={PaymentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WebViewScreen"
          component={WebViewScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
