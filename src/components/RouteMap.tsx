import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, Polyline, LatLng } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

// Simple polyline decoder (Google encoded polyline)
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

type Props = {
  destination: { latitude: number; longitude: number };
  googleMapsApiKey?: string; // required for directions API
  followUser?: boolean; // whether map centers on user
};

const RouteMap: React.FC<Props> = ({
  destination,
  googleMapsApiKey,
  followUser = true,
}) => {
  const [current, setCurrent] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const requestAndroidPermission = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (e) {
        return false;
      }
    };

    const getLocation = async () => {
      if (Platform.OS === 'android') {
        const ok = await requestAndroidPermission();
        if (!ok) {
          Alert.alert('Permission denied', 'Location permission is required');
          setLoading(false);
          return;
        }
      }
      // Use react-native-geolocation-service which is already used elsewhere in the app
      Geolocation.getCurrentPosition(
        (pos: Geolocation.GeoCoordinates | any) => {
          if (!mounted) return;
          const { latitude, longitude } = pos.coords;
          setCurrent({ latitude, longitude });
          // allow map to render even if directions are still loading
          setLoading(false);
        },
        (err: any) => {
          Alert.alert(
            'Location error',
            err.message || 'Unable to get location',
          );
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
      );
    };

    getLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    let mounted = true;

    const fetchDirections = async () => {
      if (!googleMapsApiKey) {
        setLoading(false);
        Alert.alert(
          'Missing API Key',
          'Please provide a Google Maps API key to fetch directions.',
        );
        return;
      }

      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${current.latitude},${current.longitude}&destination=${destination.latitude},${destination.longitude}&key=${googleMapsApiKey}`;
        console.log('Fetching directions from:', url);
        const res = await fetch(url);
        const data = await res.json();
        if (!mounted) return;
        if (data.routes && data.routes[0] && data.routes[0].overview_polyline) {
          const encoded = data.routes[0].overview_polyline.points;
          const points = decodePolyline(encoded);
          setRoute(points);
        } else {
          Alert.alert('Directions error', 'No route found');
        }
      } catch (e: any) {
        Alert.alert(
          'Directions error',
          e.message || 'Failed to fetch directions',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDirections();

    return () => {
      mounted = false;
    };
  }, [current, destination, googleMapsApiKey]);

  if (!current) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      region={
        followUser
          ? {
              latitude: current.latitude,
              longitude: current.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }
          : undefined
      }
    >
      <Marker coordinate={current} title="You" />
      <Marker coordinate={destination} title="Destination" />
      {route && (
        <Polyline coordinates={route} strokeWidth={5} strokeColor="#4220be88" />
      )}
    </MapView>
  );
};

export default RouteMap;

/*
Usage notes:
- This component uses `navigator.geolocation` to obtain device location. On iOS add NSLocationWhenInUseUsageDescription to Info.plist and on Android request ACCESS_FINE_LOCATION at runtime.
- Provide a `googleMapsApiKey` prop with a Maps Directions API enabled key to draw the route.
- Example:
  <RouteMap destination={{ latitude: 12.9647, longitude: 80.1961 }} googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY} />

Security: Do NOT hardcode sensitive API keys in the repo. Use env variables or secure storage.
*/
