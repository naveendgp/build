import { Alert } from 'react-native';

const GOOGLE_API_KEY = "AIzaSyDVlpYuw_2TA2c8gETZnSXyEiEvYXvYTzU"; // Using the key from ProfileLocation

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export const getDirections = async (
    startLoc: Coordinate,
    destinationLoc: Coordinate
): Promise<Coordinate[]> => {
    try {
        const mode = 'driving';
        console.log('Fetching directions from', startLoc.latitude, "skeleton", startLoc.longitude, 'to', destinationLoc.latitude, 'lattit', destinationLoc.longitude, 'GOOGLE_API_KEY', GOOGLE_API_KEY, 'mode', mode);
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc.latitude},${startLoc.longitude}&destination=${destinationLoc.latitude},${destinationLoc.longitude}&key=${GOOGLE_API_KEY}&mode=${mode}`;
        console.log('Directions API URL:', url);
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
            const points = decodePolyline(data.routes[0].overview_polyline.points);
            return points;
        } else {
            console.warn('Directions API Error:', data.status, data.error_message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching directions:', error);
        return [];
    }
};

const decodePolyline = (t: string) => {
    let points: Coordinate[] = [];
    let index = 0,
        len = t.length;
    let lat = 0,
        lng = 0;

    while (index < len) {
        let b,
            shift = 0,
            result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
};
