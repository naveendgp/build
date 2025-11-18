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
import Geolocation from "@react-native-community/geolocation";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomBtn from "../../../components/CustomBtn";

import CustomSwitch from "../../../components/CustomSwitch";
import { requestLocationPermission } from "./useLocPermission";
import MapScreen, { MapScreenHandle } from "./MapScreen";
import SvgSearchIcons from "../../../assets/auto-generated-svg-icons/SearchIcons";

const GOOGLE_API_KEY = "AIzaSyArBDwxwEtcoQ5ssKfnZoTVwd3BJWGyiJA"; // 🔐 Replace with your valid key

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

  const isEditMode = params?.isEditMode || false;
  const initialAddressData = params?.addressData;
  const addressId = params?.addressId || initialAddressData?.addressId;

  const [addressDetails, setAddressDetails] = useState(
    initialAddressData?.address_line1 || initialAddressData?.formattedAddress || ""
  );
  const [addressName, setAddressName] = useState(initialAddressData?.label || "Home");
  const [latitude, setLatitude] = useState(initialAddressData?.latitude || 0);
  const [longitude, setLongitude] = useState(initialAddressData?.longitude || 0);
  const [isDefault, setIsDefault] = useState(initialAddressData?.is_default || false);

  // 🔍 New Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapRef = useRef<MapScreenHandle | null>(null);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const granted = await requestLocationPermission();
        if (!granted) return;
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLatitude(latitude);
            setLongitude(longitude);
            // Update map marker with current location
            if (mapRef.current) {
              mapRef.current.updateMarkerPosition(latitude, longitude);
            }
          },
          (error) => console.error("Error getting current location:", error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (error) {
        console.error("Error requesting location permission:", error);
      }
    };

    if (initialAddressData?.latitude && initialAddressData?.longitude) {
      setLatitude(initialAddressData.latitude);
      setLongitude(initialAddressData.longitude);
      // Update map marker with initial address location
      if (mapRef.current) {
        mapRef.current.updateMarkerPosition(
          initialAddressData.latitude,
          initialAddressData.longitude
        );
      }
    } else {
      getCurrentLocation();
    }
  }, [initialAddressData]);

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
    if (!addressDetails.trim()) {
      Alert.alert("Error", "Please fill in the address");
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }

    // If onSelect callback is provided, use it (for shop address selection)
    // Otherwise, proceed with normal address save flow
    if (params?.onSelect) {
      params.onSelect({
        address: addressDetails,
        latitude,
        longitude,
      });
      navigation.goBack();
      return;
    }

    // Normal address save flow (requires addressName)
    if (!addressName.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // TODO: Add API call to save address here
  };

  return (
    <LinearGradient colors={[COLORS.GRADIENT_GREEN, COLORS.WHITE]} style={styles.root}>
      <Toolbar title="Select Location" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
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
                  <ActivityIndicator size="small" color={COLORS.GREEN} />
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
              onLocationSelectProp={(lat, lng, address) => {
                setLatitude(lat);
                setLongitude(lng);
                // Fill Address Line 1 with the address if provided
                if (address) {
                  setAddressDetails(address);
                }
              }}
            />
          </View>

          {/* 🏠 Address Form */}
          <View style={styles.formCard}>
            <CustomText style={styles.label}>Address Line 1*</CustomText>
            <View style={styles.inputBoxMultiline}>
              <TextInput
                value={addressDetails}
                onChangeText={setAddressDetails}
                placeholder="Type full address"
                multiline
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

            {/* <CustomText style={styles.label}>Address Name*</CustomText>
            <View style={styles.inputBox}>
              <TextInput
                value={addressName}
                onChangeText={setAddressName}
                placeholder="Home / Work / Other"
                style={styles.input}
              />
            </View> */}

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
        <View style={styles.saveWrapper}>
          <CustomBtn
            title={

              "Save Address"
            }
            onPress={handleSave}
            style={styles.saveBtn}
            textStyle={styles.saveBtnText}

          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
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
    marginTop: 24,
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
    height: 300,
    marginVertical: 24,
    alignContent: "center",
    justifyContent: "center",
    position: "relative",
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
