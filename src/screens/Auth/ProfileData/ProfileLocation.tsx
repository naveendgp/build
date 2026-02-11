import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";

import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toolbar from "../../../components/Toolbar";
import CustomText from "../../../components/Text";
import { COLORS, FONTFAMILY } from "../../../constants";
import MapScreen, { MapScreenHandle } from "./map/MapScreen";
import Geolocation from "@react-native-community/geolocation";
import { requestLocationPermission } from "./map/useLocPermission";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomBtn from "../../../components/CustomBtn";
import {
  EditAddressRequest,
  AddAddressRequest,
} from "../../../services/addressService";
import { useCommonStore } from "../../../state/zustand/commonStore";
import { useAddressStore } from "../../../state/zustand/addressStore";
import CustomSwitch from "../../../components/CustomSwitch";
import { showErrorToast, showToast } from "../../../components/Toast/Toast";
import SvgSearchIcons from "../../../assets/auto-generated-svg-icons/SearchIcons";
import BackgroundGradient from "../../../components/backgroundGradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GOOGLE_API_KEY = "AIzaSyDVlpYuw_2TA2c8gETZnSXyEiEvYXvYTzU"; // 🔐 Replace with your valid key

type RouteParams = {
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

const ProfileLocation: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || {};
  const { refreshProfile } = useCommonStore();
  const { addAddress, editAddress, isAdding, isEditing } = useAddressStore();

  const insets = useSafeAreaInsets();
  const isEditMode = params?.isEditMode || false;
  const initialAddressData = params?.addressData;
  const addressId = params?.addressId || initialAddressData?.addressId;

  console.log("initialAddressData---fefe ------", initialAddressData);

  const [addressDetails, setAddressDetails] = useState(
    initialAddressData?.address_line1 || initialAddressData?.formattedAddress || ""
  );
  const [addressName, setAddressName] = useState(initialAddressData?.label || "Home");
  const [latitude, setLatitude] = useState(
    typeof initialAddressData?.latitude === "number" ? initialAddressData.latitude : undefined
  );
  const [longitude, setLongitude] = useState(
    typeof initialAddressData?.longitude === "number" ? initialAddressData.longitude : undefined
  );
  const [isDefault, setIsDefault] = useState(initialAddressData?.is_default || false);

  // 🔍 New Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapRef = useRef<MapScreenHandle | null>(null);



  // 🔍 Fetch autocomplete suggestions
  const fetchSuggestions = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      setLoadingSuggestions(true);
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK") {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 📍 Fetch place details and center map
  const handleSelectSuggestion = async (place: any) => {
    try {
      setShowSuggestions(false);
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,geometry,formatted_address&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        setLatitude(lat);
        setLongitude(lng);
        setAddressDetails(data.result.formatted_address || place.description);

        // Update map marker position
        if (mapRef.current) {
          mapRef.current.updateMarkerPosition(lat, lng);
        }
      }
    } catch (err) {
      console.error("Error fetching place details:", err);
    }
  };

  const handleSave = async () => {
    if (!addressDetails.trim() || !addressName.trim()) {
      showErrorToast("Please fill in all required fields");
      return;
    }

    if (!latitude || !longitude) {
      showErrorToast("Please select a location on the map");
      return;
    }

    try {
      if (isEditMode && addressId) {
        // Edit existing address
        const editRequest: EditAddressRequest = {
          addressId: addressId,
          label: addressName,
          address_line1: addressDetails,
          latitude,
          longitude,
          is_default: isDefault,
        };
        const response = await editAddress(editRequest);

        if (response.success && response.data?.status) {
          await refreshProfile();
          showToast("Address updated successfully");
          navigation.goBack();
        } else {
          showErrorToast(response.error || response.data?.message || "Failed to update address");
        }
      } else {
        // Add new address
        const addRequest: AddAddressRequest = {
          label: addressName,
          address_line1: addressDetails,
          latitude,
          longitude,
        };
        const response = await addAddress(addRequest);

        if (response.success && response.data?.status) {
          await refreshProfile();
          showToast("Address added successfully");
          navigation.goBack();
        } else {
          showErrorToast(response.error || response.data?.message || "Failed to save address");
        }
      }
    } catch (err) {
      showErrorToast("Something went wrong");
    }
  };

  const DEFAULT_LAT = 12.9716;
  const DEFAULT_LNG = 77.5946;

  return (
    <View style={styles.root}>
      <BackgroundGradient />


      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, position: "absolute", width: "100%", height: "100%" }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <Toolbar title="Select Location" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 🔍 Search Row */}
          <View style={styles.searchRow}>
            <SvgSearchIcons />
            <TextInput
              placeholder="Search"
              returnKeyType="done"
              placeholderTextColor={COLORS.LOGIN_SUBTITLE}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={fetchSuggestions}
              onFocus={() => setShowSuggestions(true)}
            />
          </View>

          {/* 🔽 Suggestions List */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {loadingSuggestions ? (
                <View style={styles.suggestionItem}>
                  <ActivityIndicator size="small" color={COLORS.ACCENT} />
                  <CustomText style={styles.suggestionText}>Loading...</CustomText>
                </View>
              ) : (
                suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Ionicons name="location-outline" size={18} color={COLORS.GRAY} />
                    <CustomText
                      style={styles.suggestionText}
                      numberOfLines={2}
                    >
                      {item.description}
                    </CustomText>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* 🗺 Map Section */}
          <View style={styles.mapWrapper}>
            <MapScreen
              ref={mapRef}
              hideConfirmButton
              googleApiKey={GOOGLE_API_KEY}
              initialLatitude={latitude}
              initialLongitude={longitude}
              onLocationSelectProp={(lat, lng, address) => {
                console.log("Location selected from map:", lat, lng);
                setLatitude(lat);
                setLongitude(lng);
                // Fill Address Line 1 with the address if provided
                if (address) {
                  // Remove Google Plus Code (e.g., "W5VH+HGG", "8FVC9G8F+5W") if present at the start
                  const cleanAddress = address.replace(/^[A-Z0-9]{4,}\+[A-Z0-9]{2,}[\s,]*/, '');
                  setAddressDetails(cleanAddress);
                }
              }}
            />
          </View>

          {/* 🏠 Address Form */}
          <View style={styles.formCard}>
            <CustomText style={styles.label}>Address Details*</CustomText>
            <View style={styles.inputBoxMultiline}>
              <TextInput
                value={addressDetails}
                onChangeText={setAddressDetails}
                placeholder="Type full address"
                multiline
                returnKeyType="done"
                blurOnSubmit={true}
                style={styles.multilineInput}
              />
            </View>

            {/* <CustomText style={styles.label}>Address Line 2</CustomText>
            <View style={styles.inputBoxMultiline}>
              <TextInput
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Apartment, suite, etc. (optional)"
                multiline
                style={styles.multilineInput}
              />
            </View> */}

            <CustomText style={styles.label}>Address Name*</CustomText>
            <View style={styles.inputBox}>
              <TextInput
                value={addressName}
                onChangeText={setAddressName}
                placeholder="Home / Work / Other"
                style={styles.input}
              />
            </View>

            {isEditMode && !initialAddressData?.is_default && <View style={styles.switchBox}>
              <CustomText style={styles.label}>Make this my default address</CustomText>

              <CustomSwitch
                value={isDefault}
                onValueChange={setIsDefault}
              />
            </View>}

          </View>
        </ScrollView>

        {/* 💾 Save/Edit Button */}
        <View style={[styles.saveWrapper, { paddingBottom: insets.bottom + 16 }]}>
          <CustomBtn
            title={
              isEditing || isAdding
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                  ? "Save Address"
                  : "Save Address"
            }
            onPress={handleSave}
            style={styles.saveBtn}
            textStyle={styles.saveBtnText}
            disabled={isEditing || isAdding}
            loading={isEditing || isAdding}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileLocation;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 10 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 12,
    height: 48,
    marginHorizontal: 12,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.BOTTOM_BLACK,
    padding: 0,
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
  },
  mapWrapper: {
    alignContent: "center",
    justifyContent: "center",
    position: "relative",
    height: 300,
    marginVertical: 24,
    // marginHorizontal: 12,
    // borderRadius: 16,
    // overflow: "hidden",
    // backgroundColor: "#f0f0f0",
    // borderWidth: 1,
    // borderColor: COLORS.BORDER_INPUT,
  },
  formCard: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  label: {
    marginBottom: 8,
    color: COLORS.INPUT_TEXT,
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
  },
  inputBoxMultiline: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  multilineInput: {
    textAlign: "left",
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
    color: COLORS.BOTTOM_BLACK,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
  },
  switchBox: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    color: COLORS.BOTTOM_BLACK,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
  },
  saveWrapper: { padding: 16 },
  saveBtn: {
    backgroundColor: COLORS.ONBOARDING_BUTTON,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { color: COLORS.WHITE, fontWeight: "600" },
  suggestionsContainer: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY_3,
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.BOTTOM_BLACK,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
  },
});
