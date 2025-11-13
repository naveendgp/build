import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useRoute, useNavigation } from '@react-navigation/native';
import { requestLocationPermission } from './useLocPermission';

const MapScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);

  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get current location
  useEffect(() => {
    (async () => {
      const granted = await requestLocationPermission();
      if (!granted) return;

      Geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          const initialRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(initialRegion);
          setMarker({ latitude, longitude });
        },
        err => console.log(err),
        { enableHighAccuracy: true, timeout: 15000 },
      );
    })();
  }, []);

  const handleConfirm = () => {
    if (route.params?.onLocationSelect && marker) {
      route.params.onLocationSelect(marker.latitude, marker.longitude);
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {region && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          region={region}
          onRegionChangeComplete={r => setRegion(r)}
        >
          {marker && (
            <Marker
              draggable
              coordinate={marker}
              onDragEnd={e => setMarker(e.nativeEvent.coordinate)}
              pinColor="red" // Red marker
            />
          )}
        </MapView>
      )}

      {/* Confirm button */}
      <View style={styles.confirmBtnContainer}>
        <Text style={styles.confirmBtn} onPress={handleConfirm}>
          Confirm Location
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
