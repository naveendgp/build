import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CustomText from "../../../components/Text";
import { COLORS, STRINGS } from "../../../constants";
import AddIcon from "../../../assets/auto-generated-svg-icons/AddIcon";
import ProfileInput from "../../../components/ProfileInput";
import styles from "./style";
import Toolbar from "../../../components/Toolbar";
import CustomBtn from "../../../components/CustomBtn";
import AddressCard from "../../../components/AddressCard";
import { useCommonStore } from "../../../state/zustand/commonStore";
import { useAddressStore } from "../../../state/zustand/addressStore";
import { Address } from "../../../types/profile/profile";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { commonService } from "../../../services/commonService";
import BackgroundGradient from "../../../components/backgroundGradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showErrorToast, showToast } from "../../../components/Toast/Toast";
import CustomDialog from "../../../components/CustomDialog";
import SvgLocationLineBlackIcon from "../../../assets/auto-generated-svg-icons/LocationLineBlackIcon";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProfileDataRouteProp = RouteProp<RootStackParamList, "ProfileDataScreen">;
type ProfileDataNavProp = NativeStackNavigationProp<RootStackParamList, "ProfileDataScreen">;

const ProfileDataScreen: React.FC = () => {

  const insets = useSafeAreaInsets();

  const navigation = useNavigation<ProfileDataNavProp>();
  const route = useRoute<ProfileDataRouteProp>();
  const { profile, isLoading, error, getProfile, refreshProfile } = useCommonStore();
  const { isDeleting, deleteAddress } = useAddressStore();

  // Check if coming from Profile screen (hideContinue will be passed as param)
  const hideContinue = route.params?.hideContinue || false;
  const fromOtp = route.params?.fromOtp || false;
  const [isUpdating, setIsUpdating] = useState(false);
  const [gender, setGender] = useState<string>(profile?.gender || "");
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const allowNavigationRef = useRef(false);
  const [addressToDelete, setAddressToDelete] = useState<{ id: string; label: string } | null>(null);

  console.log("profile----------------", fromOtp);
  // Refresh profile when screen comes into focus (e.g., returning from ProfileLocation or returning from home)
  useFocusEffect(
    React.useCallback(() => {
      // Always refresh profile when screen comes into focus to get latest data
      refreshProfile();
    }, [refreshProfile])
  );

  useEffect(() => {
    // Load profile if not already loaded
    if (!profile) {
      getProfile();
    }
  }, []);


  // 1) intercept navigation back actions (header back, navigation.goBack, gestures)
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!fromOtp) return;
      if (allowNavigationRef.current) return;
      if (showDiscardDialog) return;
      e.preventDefault();
      setShowDiscardDialog(true);
    });
    return unsubscribe;
  }, [navigation, fromOtp, showDiscardDialog]);

  // 2) intercept Android hardware back (prevents app close when this screen is root)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (fromOtp && !allowNavigationRef.current) {
          setShowDiscardDialog(true);
          return true; // RETURN true to stop default back behavior
        }
        return false; // allow normal back
      };

      // only Android needs BackHandler; iOS has no hardware back
      if (Platform.OS === "android") {
        const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
        return () => sub.remove();
      }

      return undefined;
    }, [fromOtp])
  );

  const handleDiscardConfirm = async () => {
    setShowDiscardDialog(false);
    allowNavigationRef.current = true;

    await Promise.all([
      AsyncStorage.removeItem(STRINGS.IS_INIT_PROFILE_ADDRESS_UPDATED),
      AsyncStorage.removeItem(STRINGS.IS_LOGIN),
      AsyncStorage.removeItem(STRINGS.AUTH_TOKEN),
      AsyncStorage.removeItem(STRINGS.FCM_TOKEN),
    ]);

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    });
    showToast("Profile discarded successfully");
  };

  const handleDiscardClose = () => {
    setShowDiscardDialog(false);
  };

  // ...rest
  // Format address from Address type to display format
  const formatAddress = (addr: Address): string => {
    const parts = [
      addr.address_line1,
      addr.address_line2,
      addr.city,
      addr.state,
      addr.pincode
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Convert API addresses to component format
  const apiAddresses = useMemo(() => {
    if (!profile?.addresses || profile.addresses.length === 0) {
      return [];
    }
    return profile.addresses.map((addr) => ({
      id: addr._id,
      label: addr.label,
      formattedAddress: formatAddress(addr),
      isDefault: addr.is_default,
    }));
  }, [profile?.addresses]);

  // Initialize form fields from profile data
  const [name, setName] = useState(() => {
    if (profile?.addresses && profile.addresses.length > 0) {
      const defaultAddr = profile.addresses.find(addr => addr.is_default) || profile.addresses[0];
      return defaultAddr?.label || "";
    }
    return "";
  });
  const [number, setNumber] = useState(() => {
    return profile?.phone?.replace(/^\+91\s?/, "") || "";
  });
  const [mailId, setMailId] = useState(profile?.email || "");
  const [address, setAddress] = useState("Add Your Address");
  const [addresses, setAddresses] = useState<Array<{ id: string; label: string; formattedAddress: string, is_default: boolean }>>(() => {
    return apiAddresses.map(addr => ({
      id: addr.id,
      label: addr.label,
      formattedAddress: addr.formattedAddress,
      is_default: addr.isDefault,
    }));
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const trimmedName = name.trim();
  const trimmedEmail = mailId.trim();
  const isEmailProvided = trimmedEmail.length > 0;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !isEmailProvided || emailRegex.test(trimmedEmail);
  const hasAddress = addresses.length > 0;
  const canContinue = Boolean(trimmedName && hasAddress && isEmailValid && !isUpdating);

  // Update form fields when profile loads or updates
  useEffect(() => {
    if (profile) {
      // Update name from profile.name (not from address label)
      if (profile.name) {
        setName(profile.name);
      }
      else if (profile.addresses && profile.addresses.length > 0) {
        // Fallback to address label if name is not available
        // const defaultAddr = profile.addresses.find(addr => addr.is_default) || profile.addresses[0];
        // if (defaultAddr?.label) {
        //   setName(defaultAddr.label);
        // }
      }

      // Update email from profile
      if (profile.email) {
        setMailId(profile.email);
      }



      // Update phone number
      if (profile.phone) {
        setNumber(profile.phone.replace(/^\+91\s?/, ""));
      }

      // Update addresses - always refresh from API data when profile changes
      const formattedAddresses = apiAddresses.map(addr => ({
        id: addr.id,
        label: addr.label,
        formattedAddress: addr.formattedAddress,
        is_default: addr.isDefault,
      }));
      setAddresses(formattedAddresses);
    }
  }, [profile, apiAddresses]);

  // Get initials for avatar
  const getInitials = () => {
    if (name && name.length >= 2) {
      return name.substring(0, 2).toUpperCase();
    }
    if (profile?.phone) {
      return profile.phone.slice(-2).toUpperCase();
    }
    return "U";
  };

  const handleContinue = async () => {
    // Validate required fields
    if (!trimmedName) {
      showErrorToast("Please enter your name");
      return;
    }

    // Validate email format
    if (isEmailProvided && !isEmailValid) {
      showErrorToast("Please enter a valid email address");
      return;
    }
    if (addresses.length === 0) {
      showErrorToast("Please add at least one address");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await commonService.updateProfile({
        name: trimmedName,
        email: trimmedEmail,
      });

      if (response.success) {
        // Refresh profile data in store after successful update
        await refreshProfile();

        if (fromOtp) {
          // Navigate to home screen after successful update
          await AsyncStorage.setItem(STRINGS.IS_INIT_PROFILE_ADDRESS_UPDATED, 'true');
          await AsyncStorage.setItem(STRINGS.IS_LOGIN, 'true');

          // Allow navigation without showing discard dialog
          allowNavigationRef.current = true;
          navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
        } else {
          // Just go back if not from OTP
          allowNavigationRef.current = true;
          navigation.goBack();
        }
        showToast("Profile updated successfully");

      } else {
        showErrorToast(response.error || "Failed to update profile");
      }
    } catch (error) {
      showErrorToast("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const pickImage = async () => {
    // Lazy-require to avoid type issues if the package isn't installed yet
    const { launchImageLibrary } = require("react-native-image-picker");
    const options = {
      mediaType: "photo",
      selectionLimit: 1,
      includeBase64: false,
      quality: 0.9,
    };
    const result = await launchImageLibrary(options);
    if (result?.assets && result.assets.length > 0) {
      const selected = result.assets[0];
      if (selected?.uri) setAvatar(selected.uri);
    }
  };

  const handleAddLocation = () => {
    // Navigate to ProfileLocation and receive selected address via callback
    // @ts-ignore - route is registered in root stack
    navigation.navigate("ProfileLocation", {
      onSelect: (data: { formattedAddress: string; label?: string; is_default: boolean }) => {
        if (data?.formattedAddress) {
          setAddress(data.formattedAddress);
          setAddresses(prev => [
            ...prev,
            { id: String(Date.now()), label: data.label || "Home", formattedAddress: data.formattedAddress, is_default: data.is_default },
          ]);
        }
      },
    });
  };

  const handleEditAddress = (id: string) => {
    // Find the address to edit
    const addressToEdit = addresses.find(a => a.id === id);
    // Also find the corresponding API address for full details (has lat/long)
    const apiAddress = profile?.addresses?.find(addr => addr._id === id);

    navigation.navigate("ProfileLocation", {
      isEditMode: true,
      addressId: id,
      addressData: apiAddress ? {
        addressId: apiAddress._id,
        label: apiAddress.label,
        address_line1: apiAddress.address_line1,
        address_line2: apiAddress.address_line2,
        city: apiAddress.city,
        state: apiAddress.state,
        pincode: apiAddress.pincode,
        latitude: apiAddress.latitude,
        longitude: apiAddress.longitude,
        is_default: apiAddress.is_default,
        formattedAddress: formatAddress(apiAddress),
      } : addressToEdit ? {
        addressId: id,
        label: addressToEdit.label,
        formattedAddress: addressToEdit.formattedAddress,
        // fall back to zeroes if lat/long missing in lightweight object
        latitude: 0,
        longitude: 0,
      } : undefined,
    });
  };

  const handleDeleteAddress = async (id: string) => {
    // Find the address to confirm deletion
    const address = addresses.find(a => a.id === id);
    if (address) {
      setAddressToDelete({ id, label: address.label });
      setShowDeleteDialog(true);
    }
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;

    setShowDeleteDialog(false);
    const id = addressToDelete.id;

    const response = await deleteAddress(id);

    if (response.success && response.data?.status) {
      // Refresh profile data to get updated addresses
      await refreshProfile();

      // Also update local state immediately
      setAddresses(prev => prev.filter(a => a.id !== id));

      showToast("Address deleted successfully");
    } else {
      showErrorToast(response.error || response.data?.message || "Failed to delete address");
    }

    setAddressToDelete(null);
  };

  if (isLoading && !profile) {
    return (
      <View style={{ flex: 1 }}>

        <BackgroundGradient />
        <View style={[styles.root, styles.safe]}>
          <Toolbar
            title="Profile"
            showBackIcon={!fromOtp}
            onBackPress={fromOtp ? () => setShowDiscardDialog(true) : navigation.goBack}
          />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
            <CustomText style={{ marginTop: 12, color: COLORS.LOGIN_SUBTITLE }}>
              Loading profile...
            </CustomText>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.safe}
    >
      <BackgroundGradient />
      <View style={[styles.root]}>
        <Toolbar
          showBackIcon={!fromOtp}
          title="Profile"
          onBackPress={fromOtp ? () => setShowDiscardDialog(true) : navigation.goBack}
        />

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Details Card */}
          <View style={styles.card}>
            {/* Profile Picture */}
            <TouchableOpacity style={styles.profilePictureContainer}
              //  onPress={pickImage} 
              activeOpacity={0.8}>
              <View style={styles.profilePicture}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={{ width: "100%", height: "100%", borderRadius: 50, resizeMode: 'contain' }} />
                ) : (
                  <CustomText style={styles.profileInitials}>{getInitials()}</CustomText>
                )}
              </View>
            </TouchableOpacity>

            {/* Name Field */}
            <ProfileInput
              label="Name"
              required
              inputType="normal"
              value={name}
              onChangeText={setName}
            />

            {/* Number Field */}
            <ProfileInput
              label="Number"
              isEditable={false}
              inputType="phone"
              value={number}
              onChangeText={setNumber}
              countryCode="+91"
            />

            {/* Mail ID Field */}
            <ProfileInput
              label="Mail ID"
              inputType="email"
              value={mailId}
              onChangeText={setMailId}
            />


          </View>


          {/* Address Card */}
          <View style={styles.card}>
            <CustomText style={styles.sectionTitle}>Address</CustomText>
            {addresses.length === 0 ? (
              <View style={styles.addressContainer}>
                <View style={styles.addressHeader}>
                  <View style={styles.iconWrapper}>
                    <SvgLocationLineBlackIcon width={24} height={24} />
                  </View>
                  <CustomText style={styles.addressLabel}>
                    Home Address<CustomText style={styles.asterisk}>*</CustomText>
                  </CustomText>
                </View>
                <CustomText style={styles.addressPlaceholder}>{address}</CustomText>
                <TouchableOpacity style={styles.addLocationButton} onPress={handleAddLocation}>
                  <AddIcon width={24} height={24} />
                  <CustomText style={styles.addLocationText}>Add location</CustomText>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {addresses.map(item => (
                  <AddressCard
                    key={item.id}
                    label={item.label}
                    formattedAddress={item.formattedAddress}
                    onEdit={() => handleEditAddress(item.id)}
                    onDelete={() => handleDeleteAddress(item.id)}
                    isDeleting={isDeleting === item.id}
                    is_default={item.is_default}
                  />
                ))}
                <TouchableOpacity style={[styles.addLocationButton, { marginTop: 8 }]} onPress={handleAddLocation}>
                  <AddIcon width={24} height={24} />
                  <CustomText style={styles.addLocationText}>Add Location</CustomText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        {/* Continue Button - Hide when coming from Profile screen */}
        {(
          <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            <CustomBtn
              title={isUpdating ? "Updating..." : "Continue"}
              onPress={handleContinue}
              style={StyleSheet.flatten([
                styles.continueButton,
                !canContinue ? { opacity: 0.6 } : undefined,
              ])}
              textStyle={styles.continueText}
              loading={isUpdating}
              disabled={!canContinue}
            />
          </View>
        )}

        {/* Delete Address Dialog */}
        <CustomDialog
          visible={showDeleteDialog}
          title="Delete Address"
          content={`Are you sure you want to delete "${addressToDelete?.label || 'this address'}"?`}
          onClose={() => {
            setShowDeleteDialog(false);
            setAddressToDelete(null);
          }}
          onConfirm={confirmDeleteAddress}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <CustomDialog
          visible={showDiscardDialog}
          title="Discard Changes"
          content="Are you sure you want to discard the changes?"
          onClose={handleDiscardClose}
          onConfirm={handleDiscardConfirm}
          confirmText="Yes"
          cancelText="No"
        />
      </View>
    </View>
  );
};

export default ProfileDataScreen;

