import axios from 'axios';
import { GoogleConfig } from '../config/database.config';

class GoogleMapsGeocoder {
  static instance = null;
  apiKey = null;
  baseUrl = null;
  distanceUrl = null;

  constructor() {
    if (GoogleMapsGeocoder.instance) {
      return GoogleMapsGeocoder.instance;
    }

    this.apiKey = GoogleConfig.CLIENT_ID;
    if (!this.apiKey) {
      throw new Error(
        '❌ GOOGLE_MAPS_API_KEY not found in environment variables',
      );
    }

    this.baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    this.distanceUrl =
      'https://maps.googleapis.com/maps/api/distancematrix/json';

    GoogleMapsGeocoder.instance = this;
  }

  /**
   * Get formatted address and components from lat,lng
   */
  async getAddress(lat, lng) {
    try {
      const url = `${this.baseUrl}?latlng=${lat},${lng}&key=${this.apiKey}`;
      const { data } = await axios.get(url);

      const results = data.results;
      if (!results?.length)
        return { formatted_address: 'No address found', components: {} };

      const best = results[0];
      const formatted_address = best.formatted_address;
      const components = this.parseComponents(best.address_components);

      return { formatted_address, components };
    } catch (error) {
      console.error('Error fetching address:', error.message);
      return { formatted_address: 'Error retrieving address', components: {} };
    }
  }

  /**
   * Parse address components into structured fields
   */
  parseComponents(components) {
    const get = (type) =>
      components.find((c) => c.types.includes(type))?.long_name || '';

    return {
      area:
        get('sublocality') ||
        get('sublocality_level_1') ||
        get('neighborhood') ||
        get('locality') ||
        'Unknown Area',
      locality: get('neighborhood') || get('route'),
      city: get('locality') || get('administrative_area_level_2'),
      state: get('administrative_area_level_1'),
      pincode: get('postal_code'),
      country: get('country'),
    };
  }

  /**
   * Get driving distance and duration between two coordinates
   * @param {number} originLat
   * @param {number} originLng
   * @param {number} destLat
   * @param {number} destLng
   * @returns {Promise<{distance_text: string, distance_value: number, duration_text: string, duration_value: number}>}
   */
  async getDistance(originLat, originLng, destLat, destLng) {
    try {
      const url = `${this.distanceUrl}?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&key=${this.apiKey}`;
      const { data } = await axios.get(url);

      if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) {
        throw new Error('Invalid response from Distance Matrix API');
      }

      const element = data.rows[0].elements[0];
      if (element.status !== 'OK') {
        throw new Error('No route found between given coordinates');
      }

      return {
        distance_text: element.distance.text,
        distance_value: element.distance.value,
        duration_text: element.duration.text,
        duration_value: element.duration.value,
        destination_address: data.destination_addresses[0],
        target_address: data.origin_addresses[0],
      };
    } catch (error) {
      console.error('Error fetching distance:', error.message);
      return {
        distance_text: 'Error retrieving distance',
        distance_value: 0,
        duration_text: '',
        duration_value: 0,
      };
    }
  }
}

export default new GoogleMapsGeocoder();
