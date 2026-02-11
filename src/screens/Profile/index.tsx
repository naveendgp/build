import React, { useState } from "react";
import { View, StatusBar, ActivityIndicator, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import { COLORS } from "../../constants";
import LogoutDialog from "../../components/CustomDialog";
import styles from "./style";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useProfile } from "./hooks/useProfile";
import ProfileHeader from "./components/ProfileHeader";
import ProfileCard from "./components/ProfileCard";
import SupportList from "./components/SupportList";
import LogoutButton from "./components/LogoutButton";
import BackgroundGradient from "../../components/backgroundGradient";
import CustomDialog from "../../components/CustomDialog";
import { useAuthStore } from "../../state/zustand/authStore";
import { useCommonStore } from "../../state/zustand/commonStore";
import { getErrorMessageFromMultiple } from "../../utils/errorUtils";
import { openWhatsApp } from "../../utils/whatsappUtils";
import ErrorState from "../../components/ErrorState";
import { showErrorToast } from "../../components/Toast/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";


type Nav = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {
    profile,
    isLoading,
    showLogoutDialog,
    setShowLogoutDialog,
    getDefaultAddressWithLabel,
    formatPhone,
    error,
    getInitials,

  } = useProfile();
  const { label, address } = getDefaultAddressWithLabel();
  const { logout: authLogout } = useAuthStore();
  const { logout: commonLogout } = useCommonStore();

  const handleSupportPress = async () => {
    const phone = profile?.support_phone_number;

    if (!phone) {
      showErrorToast("Support phone number not found");
      return;
    }

    try {
      await openWhatsApp(phone);
    } catch (e) {
      showErrorToast("Unable to open WhatsApp");
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <BackgroundGradient />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
        </View>
      </View>
    );
  }

  if (error) {
    return (

      <ErrorState
        retryButtonText="Retry"
        message={getErrorMessageFromMultiple([error])} />

    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <View style={[styles.root, { paddingTop: insets.top }]}>

        <ProfileHeader onNotificationPress={() => navigation.navigate("NotificationScreen")} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <ProfileCard
            initials={getInitials()}
            name={profile?.name}
            phone={profile ? formatPhone(profile.phone) : "+91 0000000000"}
            email={profile?.email || "N/A"}
            address={profile ? address : "No address provided"}
            label={label}
            onEditPress={() => navigation.navigate("ProfileDataScreen", { fromOtp: false, hideContinue: true })}
          />

          <SupportList
            onSupportPress={handleSupportPress}
            onPrivacyPress={() => {
              navigation.navigate("WebViewScreen", {
                url: 'https://www.otterlaundry.com/privacy',
                title: "Privacy & Security",
              });
            }}
            onTermsPress={() => {
              navigation.navigate("WebViewScreen", {
                url: 'https://www.otterlaundry.com/terms',
                title: "Terms & Condition",
              });
            }}
            onInvoicePress={() => navigation.navigate("InvoiceScreen")}
          />

          <LogoutButton onPress={() => setShowLogoutDialog(true)} />
        </ScrollView>

        <CustomDialog
          visible={showLogoutDialog}
          title="Log Out"
          content="Are you sure you want to log out from your account?"
          onClose={() => setShowLogoutDialog(false)}
          onConfirm={async () => {
            setShowLogoutDialog(false);
            // Call logout API and clear local state - logout even if API fails
            try {
              // Call both logout functions - they handle API call and local state clearing
              await Promise.all([
                commonLogout(), // Calls API and clears common store
                authLogout(),   // Clears auth store and AsyncStorage
              ]);
            } catch (error) {
              // Even if logout fails, ensure user is logged out locally
              console.error('Logout error:', error);
              // authLogout already clears storage, so we can proceed with navigation
            } finally {
              // Navigate to login screen regardless of API success/failure
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            }
          }}
        />
      </View>

    </View>
  );
};

export default ProfileScreen;