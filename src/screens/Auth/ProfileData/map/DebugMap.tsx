import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { requestLocationPermission } from './useLocPermission';

const DEFAULT_REGION: Region = {
    latitude: 12.9715987,
    longitude: 77.5945627,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

const DebugMap: React.FC = () => {
    const [region, setRegion] = useState<Region | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const mapRef = useRef<MapView | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const granted = await requestLocationPermission();
                setPermissionGranted(granted);
                if (granted) {
                    Geolocation.getCurrentPosition(
                        pos => {
                            const { latitude, longitude } = pos.coords;
                            const r: Region = {
                                latitude,
                                longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            };
                            setRegion(r);
                            if (mapRef.current) mapRef.current.animateToRegion(r, 500);
                        },
                        err => {
                            console.warn('Geolocation error (DebugMap):', err.message);
                            setRegion(DEFAULT_REGION);
                        },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
                    );
                } else {
                    setRegion(DEFAULT_REGION);
                }
            } catch (e) {
                console.warn('DebugMap permission error', e);
                setRegion(DEFAULT_REGION);
            }
        })();
    }, []);

    const handleCenter = () => {
        if (region && mapRef.current) mapRef.current.animateToRegion(region, 400);
        else if (mapRef.current) mapRef.current.animateToRegion(DEFAULT_REGION, 400);
    };

    return (
        <View style={styles.container}>
            {region ? (
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    region={region}
                    showsUserLocation
                    showsMyLocationButton={false}
                    onMapReady={() => console.log('DebugMap: map ready')}
                />
            ) : (
                <View style={styles.loading}>
                    <Text>Loading map...</Text>
                </View>
            )}

            <View style={styles.controls} pointerEvents="box-none">
                <TouchableOpacity style={styles.btn} onPress={handleCenter}>
                    <Text style={styles.btnText}>Center</Text>
                </TouchableOpacity>
                <View style={styles.info}>
                    <Text style={styles.infoText}>Permission: {permissionGranted === null ? '...' : permissionGranted ? 'granted' : 'denied'}</Text>
                    <Text style={styles.infoText}>Provider: Google Maps</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    controls: { position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' },
    btn: { backgroundColor: '#fff', padding: 10, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
    btnText: { color: '#333', fontWeight: '600' },
    info: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8 },
    infoText: { fontSize: 12, color: '#333' },
});

export default DebugMap;
