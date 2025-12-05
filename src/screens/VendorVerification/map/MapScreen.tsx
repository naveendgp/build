import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useRoute, useNavigation } from '@react-navigation/native';
import { requestLocationPermission } from './useLocPermission';
import { COLORS, FONTFAMILY } from '../../../constants';
import SvgLocationFocusIcon from '../../../assets/auto-generated-svg-icons/LocateFocusIcon';
import SvgLocationRedIcon from '../../../assets/auto-generated-svg-icons/LocationRedIcon';

// Helper function to fetch address from coordinates using Google Geocoding API
const fetchAddressFromCoordinates = async (lat: number, lng: number, apiKey: string): Promise<string> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Return the formatted address from the first result
      return data.results[0].formatted_address;
    }
    throw new Error('No address found');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

type MapScreenProps = {
  onLocationSelectProp?: (latitude: number, longitude: number, address?: string) => void;
  hideConfirmButton?: boolean;
  googleApiKey?: string;
};

export type MapScreenHandle = {
  centerOnMarker: () => void;
  updateMarkerPosition: (latitude: number, longitude: number) => void;
};

const CHENNAI_FALLBACK: Region = {
  latitude: 12.9716,
  longitude: 80.2206,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MapScreen = forwardRef<MapScreenHandle, MapScreenProps>(({ onLocationSelectProp, hideConfirmButton, googleApiKey }, ref) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);
  const isProgrammaticUpdate = useRef(false);

  const regionRef = useRef<Region | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isResolvingInitialLocation, setIsResolvingInitialLocation] = useState(true);

  // Get current location on mount and set as initial region
  useEffect(() => {
    (async () => {
      const granted = await requestLocationPermission();
      if (!granted) {
        // permission denied — use fallback
        setRegion(CHENNAI_FALLBACK);
        regionRef.current = CHENNAI_FALLBACK;
        setIsResolvingInitialLocation(false);
        return;
      }

      Geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          const initialRegion: Region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(initialRegion);
          regionRef.current = initialRegion;
          setMarker({ latitude, longitude });
          setIsResolvingInitialLocation(false);
        },
        err => {
          console.log('Error getting initial location:', err);
          // fallback on error
          setRegion(CHENNAI_FALLBACK);
          regionRef.current = CHENNAI_FALLBACK;
          setIsResolvingInitialLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000 },
      );
    })();
  }, []);

  useImperativeHandle(ref, () => ({
    centerOnMarker: () => {
      if (marker && mapRef.current) {
        const currentRegion = regionRef.current ?? CHENNAI_FALLBACK;
        const targetRegion = {
          latitude: marker.latitude,
          longitude: marker.longitude,
          latitudeDelta: currentRegion.latitudeDelta ?? 0.01,
          longitudeDelta: currentRegion.longitudeDelta ?? 0.01,
        };
        mapRef.current.animateToRegion(targetRegion, 500);
      }
    },
    updateMarkerPosition: (lat: number, lng: number) => {
      const newMarker = { latitude: lat, longitude: lng };
      setMarker(newMarker);

      const currentRegion = regionRef.current ?? CHENNAI_FALLBACK;
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: currentRegion.latitudeDelta ?? 0.01,
        longitudeDelta: currentRegion.longitudeDelta ?? 0.01,
      };

      // Set flag to prevent onRegionChangeComplete from interfering
      isProgrammaticUpdate.current = true;
      setRegion(newRegion);
      regionRef.current = newRegion;

      // Animate map to new position
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }

      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 600);
    },
  }), [marker]);

  const handleConfirm = () => {
    if (!marker) return;
    if (onLocationSelectProp) {
      onLocationSelectProp(marker.latitude, marker.longitude);
      return;
    }
    if (route.params?.onLocationSelect) {
      route.params.onLocationSelect(marker.latitude, marker.longitude);
      navigation.goBack();
    }
  };

  const handleUseCurrentLocation = async (retryCount = 0) => {
    if (isLoadingLocation) return; // Prevent multiple simultaneous requests

    try {
      setIsLoadingLocation(true);
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert("Permission Denied", "Location permission is required to use current location. Please enable it in your device settings.");
        setIsLoadingLocation(false);
        return;
      }

      // Strategy: Try with network location first (faster), then high accuracy if needed
      const useHighAccuracy = retryCount > 0;
      const timeout = useHighAccuracy ? 30000 : 15000; // Longer timeout for high accuracy

      console.log(`Attempting to get location (attempt ${retryCount + 1}, highAccuracy: ${useHighAccuracy})`);

      Geolocation.getCurrentPosition(
        pos => {
          setIsLoadingLocation(false);
          const { latitude, longitude } = pos.coords;
          console.log("Current location fetched successfully:", { latitude, longitude, accuracy: pos.coords.accuracy });

          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: regionRef.current?.latitudeDelta ?? 0.01,
            longitudeDelta: regionRef.current?.longitudeDelta ?? 0.01,
          };

          // Update marker and region
          const newMarker = { latitude, longitude };
          setMarker(newMarker);

          // Set flag to prevent onRegionChangeComplete from interfering
          isProgrammaticUpdate.current = true;
          setRegion(newRegion);
          regionRef.current = newRegion;

          // Animate map to new position
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 500);
          }

          // Reset flag after animation completes
          setTimeout(() => {
            isProgrammaticUpdate.current = false;
          }, 600);

          // Fetch address using reverse geocoding
          if (googleApiKey) {
            fetchAddressFromCoordinates(latitude, longitude, googleApiKey)
              .then(address => {
                // Call callback with coordinates and address
                if (onLocationSelectProp) {
                  onLocationSelectProp(latitude, longitude, address);
                }
              })
              .catch(err => {
                console.error("Error fetching address:", err);
                // Call callback with coordinates only if address fetch fails
                if (onLocationSelectProp) {
                  onLocationSelectProp(latitude, longitude);
                }
              });
          } else {
            // Call callback without address if no API key
            if (onLocationSelectProp) {
              onLocationSelectProp(latitude, longitude);
            }
          }
        },
        err => {
          console.error("Error getting current location:", {
            code: err.code,
            message: err.message,
            attempt: retryCount + 1
          });

          // If timeout and we haven't tried high accuracy yet, retry with high accuracy
          if (err.code === 3 && !useHighAccuracy && retryCount === 0) {
            console.log("Retrying with high accuracy GPS...");
            setIsLoadingLocation(false);
            setTimeout(() => {
              handleUseCurrentLocation(1); // Retry with high accuracy
            }, 1000);
            return;
          }

          setIsLoadingLocation(false);

          // Handle specific error codes
          let errorMessage = "Failed to get current location";
          if (err.code === 1) {
            errorMessage = "Location permission was denied. Please enable location access in your device settings.";
          } else if (err.code === 2) {
            errorMessage = "Location is unavailable. Please check your GPS settings and ensure location services are enabled.";
          } else if (err.code === 3) {
            errorMessage = "Location request timed out. Please ensure:\n• GPS is enabled\n• You're outdoors or near a window\n• Location services are enabled\n\nWould you like to try again?";
          } else if (err.message) {
            errorMessage = `Failed to get location: ${err.message}`;
          } else {
            errorMessage = "Failed to get current location. Please ensure GPS is enabled and try again.";
          }

          // Show alert with retry option for timeout errors
          if (err.code === 3) {
            Alert.alert(
              "Location Timeout",
              errorMessage,
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Retry",
                  onPress: () => handleUseCurrentLocation(0)
                }
              ]
            );
          } else {
            Alert.alert("Location Error", errorMessage);
          }
        },
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: timeout,
          maximumAge: 10000, // Accept cached location up to 10 seconds old
          distanceFilter: 50 // Accept location updates if moved 50 meters
        }
      );
    } catch (error: any) {
      setIsLoadingLocation(false);
      console.error("Error requesting location permission:", error);
      Alert.alert("Error", `Failed to request location permission: ${error?.message || 'Unknown error'}`);
    }
  };

  // While resolving initial location, show loader (or placeholder)
  if (isResolvingInitialLocation) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Finding your location…</Text>
      </View>
    );
  }

  // Now region is guaranteed non-null (either current location or fallback)
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={region ?? CHENNAI_FALLBACK}
        region={region ?? CHENNAI_FALLBACK}
        onRegionChangeComplete={r => {
          // Don't update region if we're programmatically updating
          if (!isProgrammaticUpdate.current) {
            setRegion(r);
            regionRef.current = r;
          }
        }}
      >
        {marker && (
          <Marker
            coordinate={marker}
            draggable
            onDragEnd={async (e) => {
              const newCoordinate = e.nativeEvent.coordinate;
              setMarker(newCoordinate);

              // Fetch address when marker is dragged
              if (googleApiKey && onLocationSelectProp) {
                try {
                  const address = await fetchAddressFromCoordinates(
                    newCoordinate.latitude,
                    newCoordinate.longitude,
                    googleApiKey
                  );
                  onLocationSelectProp(newCoordinate.latitude, newCoordinate.longitude, address);
                } catch (error) {
                  console.error("Error fetching address after drag:", error);
                  // Call callback with coordinates only if address fetch fails
                  onLocationSelectProp(newCoordinate.latitude, newCoordinate.longitude);
                }
              } else if (onLocationSelectProp) {
                // Call callback without address if no API key
                onLocationSelectProp(newCoordinate.latitude, newCoordinate.longitude);
              }
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <SvgLocationRedIcon />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Use Current Location button */}
      <View style={styles.currentLocationBtnContainer}>
        <TouchableOpacity
          style={[styles.currentLocationBtn, isLoadingLocation && styles.currentLocationBtnDisabled]}
          onPress={() => handleUseCurrentLocation(0)}
          disabled={isLoadingLocation}
        >
          <SvgLocationFocusIcon />
          <Text style={[styles.currentLocationBtnText, isLoadingLocation && styles.currentLocationBtnTextDisabled]}>
            {isLoadingLocation ? "Getting Location..." : "Use Current Location"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirm button */}
      {!hideConfirmButton && (
        <View style={styles.confirmBtnContainer}>
          <Text style={styles.confirmBtn} onPress={handleConfirm}>
            Confirm Location
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationBtnContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  currentLocationBtnText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.THEME_GREEN,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
  },
  currentLocationBtnDisabled: {
    opacity: 0.6,
  },
  currentLocationBtnTextDisabled: {
    color: '#999999',
  },
  confirmBtnContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  confirmBtn: {
    backgroundColor: '#2E86DE',
    color: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MapScreen;
