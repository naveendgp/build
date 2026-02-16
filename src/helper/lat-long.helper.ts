import axios from 'axios';
import { GoogleConfig } from '../config/database.config';

export function calculateLatLong(
  radius: number,
  userLat: number,
  userLong: number,
) {
  const R = 6371; // Earth's radius in km

  const latDelta = (radius / R) * (180 / Math.PI);
  const longDelta =
    ((radius / R) * (180 / Math.PI)) / Math.cos((userLat * Math.PI) / 180);

  const minLat = Math.ceil((userLat - latDelta) * 100) / 100;
  const maxLat = Math.ceil((userLat + latDelta) * 100) / 100;
  const minLong = Math.ceil((userLong - longDelta) * 100) / 100;
  const maxLong = Math.ceil((userLong + longDelta) * 100) / 100;

  return { minLat, maxLat, minLong, maxLong };
}

export async function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): Promise<number> {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&mode=driving&key=${GoogleConfig.CLIENT_ID}`;
    const { data } = await axios.get(url);

    if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) {
      throw new Error('Invalid response from Distance Matrix API');
    }

    const element = data.rows[0].elements[0];
    if (element.status !== 'OK') {
      throw new Error('No route found between given coordinates');
    }

    // Convert distance from meters to kilometers
    const distanceInMeters = element.distance.value;
    const distanceInKm = distanceInMeters / 1000;
    
    return distanceInKm;
  } catch (error) {
    console.error('Error fetching distance from Google API:', error.message);
    // Fallback to Haversine formula if API call fails
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }
}
