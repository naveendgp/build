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
import LocationIcon from "../../../assets/auto-generated-svg-icons/LocationIcon";
import SvgRightArrowIcon from "../../../assets/auto-generated-svg-icons/RightArrowIcon";
import SvgLocateIcon from "../../../assets/auto-generated-svg-icons/LocateIcon";

const GOOGLE_API_KEY = "AIzaSyArBDwxwEtcoQ5ssKfnZoTVwd3BJWGyiJA"; // 🔐 Replace with your valid key

// Type for address components from Google Geocoding API
type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GeocodeResult = {
  formatted_address: string;
  address_components: AddressComponent[];
};

// Helper function to extract overview address (sublocality, sublocality_level_1, city)
const extractOverviewAddress = (addressComponents: AddressComponent[]): string => {
  const parts: string[] = [];

  // Extract sublocality (e.g., "Sri Ammbal Nagar")
  const sublocality = addressComponents.find(
    (component) => component.types.includes('sublocality')
  );
  if (sublocality) {
    parts.push(sublocality.long_name);
  }

  // Extract sublocality_level_1 (e.g., "Keelkattalai")
  const sublocalityLevel1 = addressComponents.find(
    (component) => component.types.includes('sublocality_level_1')
  );
  if (sublocalityLevel1) {
    parts.push(sublocalityLevel1.long_name);
  }

  // Extract city (locality or administrative_area_level_2)
  const city = addressComponents.find(
    (component) =>
      component.types.includes('locality') ||
      component.types.includes('administrative_area_level_2')
  );
  if (city) {
    parts.push(city.long_name);
  }

  return parts.join(', ');
};

// Helper function to fetch address from coordinates using Google Geocoding API
// Returns both full address and overview address
const fetchAddressFromCoordinates = async (
  lat: number,
  lng: number
): Promise<{ fullAddress: string; overviewAddress: string }> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result: GeocodeResult = data.results[0];
      const fullAddress = result.formatted_address;
      const overviewAddress = extractOverviewAddress(result.address_components);

      return {
        fullAddress,
        overviewAddress: overviewAddress || fullAddress, // Fallback to full address if overview is empty
      };
    }
    throw new Error('No address found');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

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
  existingData?: {
    address: string;
    address_line2?: string;
    latitude: number;
    longitude: number;
  };
} | undefined;

const ProfileLocation: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || {};

  const isEditMode = params?.isEditMode || false;
  const initialAddressData = params?.addressData;
  const existingData = params?.existingData; // Existing data from shop details
  const addressId = params?.addressId || initialAddressData?.addressId;

  // City, state overview (for address_line2) - e.g., "Sri Ammbal Nagar, Keelkattalai, Chennai"
  const [addressOverview, setAddressOverview] = useState(
    existingData?.address_line2 || initialAddressData?.address_line2 || ""
  );
  // Full detailed address (for address_line1) - e.g., "55, Balamurugan Nagar, Sri Ammbal Nagar, Keelkattalai, Chennai, Tamil Nadu 600117, India"
  const [addressDetails, setAddressDetails] = useState(
    existingData?.address || initialAddressData?.formattedAddress || initialAddressData?.address_line1 || ""
  );
  const [addressName, setAddressName] = useState(initialAddressData?.label || "Home");
  const [latitude, setLatitude] = useState(existingData?.latitude || initialAddressData?.latitude || 0);
  const [longitude, setLongitude] = useState(existingData?.longitude || initialAddressData?.longitude || 0);
  const [isDefault, setIsDefault] = useState(initialAddressData?.is_default || false);

  // 🔍 New Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapRef = useRef<MapScreenHandle | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const granted = await requestLocationPermission();
        if (!granted) return;
        Geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLatitude(latitude);
            setLongitude(longitude);
            // Update map marker with current location
            if (mapRef.current) {
              mapRef.current.updateMarkerPosition(latitude, longitude);
            }
            // Fetch address from coordinates
            try {
              const { fullAddress, overviewAddress } = await fetchAddressFromCoordinates(latitude, longitude);
              setAddressOverview(overviewAddress);
              setAddressDetails(fullAddress);
            } catch (error) {
              console.error("Error fetching address:", error);
            }
          },
          (error) => console.error("Error getting current location:", error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (error) {
        console.error("Error requesting location permission:", error);
      }
    };

    // Priority: existingData > initialAddressData > current location
    if (existingData?.latitude && existingData?.longitude) {
      // Use existing data from shop details
      setLatitude(existingData.latitude);
      setLongitude(existingData.longitude);

      // Set full address (for address_line1) - existingData.address contains full address
      setAddressDetails(existingData.address || "");
      // Set city, state overview (for address_line2) - existingData.address_line2 contains city, state
      setAddressOverview(existingData.address_line2 || "");

      // If address_line2 is not provided, fetch both addresses from coordinates
      if (!existingData.address_line2 || !existingData.address) {
        fetchAddressFromCoordinates(existingData.latitude, existingData.longitude)
          .then(({ fullAddress, overviewAddress }) => {
            setAddressDetails(fullAddress); // Full address for address_line1
            setAddressOverview(overviewAddress); // City, state for address_line2
          })
          .catch((error) => {
            console.error("Error fetching address:", error);
            // Fallback to existing address if fetch fails
            if (existingData.address) {
              setAddressDetails(existingData.address);
              setAddressOverview(existingData.address);
            }
          });
      }

    } else if (initialAddressData?.latitude && initialAddressData?.longitude) {
      // Use initial address data (from edit mode)
      setLatitude(initialAddressData.latitude);
      setLongitude(initialAddressData.longitude);
      // Set city, state overview from address_line2, full address from address_line1 or formattedAddress
      setAddressOverview(initialAddressData.address_line2 || "");
      setAddressDetails(initialAddressData.formattedAddress || initialAddressData.address_line1 || "");
      // Update map marker with initial address location
      if (mapRef.current) {
        mapRef.current.updateMarkerPosition(
          initialAddressData.latitude,
          initialAddressData.longitude
        );
      }
    } else {
      // Fetch current location and address when screen loads (no existing data)
      getCurrentLocation();
    }
  }, [existingData, initialAddressData]);

  // Set map marker when map ref is ready and we have existing coordinates
  useEffect(() => {
    if (existingData?.latitude && existingData?.longitude) {
      // Use a delay to ensure map component is fully mounted
      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.updateMarkerPosition(existingData.latitude, existingData.longitude);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [existingData]);

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
      // Close keyboard when suggestion is selected
      Keyboard.dismiss();

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,geometry,formatted_address&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        setLatitude(lat);
        setLongitude(lng);

        // Fetch full geocode result to extract overview and full address
        try {
          const { fullAddress, overviewAddress } = await fetchAddressFromCoordinates(lat, lng);
          setAddressOverview(overviewAddress);
          setAddressDetails(fullAddress);
        } catch (error) {
          console.error("Error fetching address:", error);
          // Fallback to formatted address if extraction fails
          const fallbackAddress = data.result.formatted_address || place.description;
          setAddressOverview(fallbackAddress);
          setAddressDetails(fallbackAddress);
        }

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
        address: addressDetails, // Full address for address_line1
        //  address_line2: addressOverview, // City, state overview for address_line2
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
    <View style={styles.root}>
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
              ref={searchInputRef}
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
                    <SvgLocateIcon />
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
              onLocationSelectProp={async (lat, lng, address) => {
                setLatitude(lat);
                setLongitude(lng);
                // Fetch both overview and full address from coordinates
                try {
                  const { fullAddress, overviewAddress } = await fetchAddressFromCoordinates(lat, lng);
                  setAddressOverview(overviewAddress);
                  setAddressDetails(fullAddress);
                } catch (error) {
                  console.error("Error fetching address:", error);
                  // Fallback if address is provided
                  if (address) {
                    setAddressOverview(address);
                    setAddressDetails(address);
                  }
                }
              }}
            />
          </View>



          {/* 🏠 Address Form */}
          <View style={styles.formCard}>

            {/* <CustomText style={styles.label}>Address*</CustomText>
            <TouchableOpacity
              style={styles.defaultLocBox}
              onPress={() => {
                // Focus the search input and open keyboard
                searchInputRef.current?.focus();
              }}
              activeOpacity={0.7}
            >
              <LocationIcon width={14} height={18} />
              <View style={styles.inputContainer}>
                {addressOverview ? (
                  <CustomText
                    style={styles.inputText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {addressOverview}
                  </CustomText>
                ) : (
                  <CustomText style={styles.inputPlaceholder}>
                    Address is fetching...
                  </CustomText>
                )}
              </View>
              <SvgRightArrowIcon />
            </TouchableOpacity> */}



            <CustomText style={styles.label}>Address Details*</CustomText>
            <View style={styles.inputBoxMultiline}>
              <TextInput
                value={addressDetails}
                onChangeText={setAddressDetails}
                placeholder="Type full address"
                multiline
                style={styles.multilineInput}
              />
            </View>



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
    </View>
  );
};

export default ProfileLocation;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.WHITE },
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
  defaultLocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    minHeight: 48,
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
  inputContainer: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    justifyContent: 'center',
    minWidth: 0, // Important for proper text truncation in flex containers
  },
  inputText: {
    color: COLORS.BOTTOM_BLACK,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
    textAlign: 'left',
    includeFontPadding: false,
  },
  inputPlaceholder: {
    color: COLORS.LOGIN_SUBTITLE,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
    textAlign: 'left',
    includeFontPadding: false,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: COLORS.BOTTOM_BLACK,
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
    minWidth: 0, // Important for proper text truncation in flex containers
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
