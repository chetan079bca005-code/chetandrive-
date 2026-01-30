import { API_CONFIG } from '../config/constants';

const NOMINATIM_BASE_URL = API_CONFIG.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = API_CONFIG.OSRM_BASE_URL || 'https://router.project-osrm.org';
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'User-Agent': API_CONFIG.NOMINATIM_USER_AGENT || 'RideBook/1.0',
};

export interface GalliLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  type?: string;
}

export interface GalliAutocompleteResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  type: string;
}

export interface GalliRouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

export interface GalliDistanceResult {
  distance: number;
  duration: number;
}

class GalliMapsService {
  private accessToken: string;

  constructor() {
    this.accessToken = API_CONFIG.GALLI_MAP_ACCESS_TOKEN || '';
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Search for places using autocomplete
   * @param query Search query string
   * @param latitude Current latitude (optional)
   * @param longitude Current longitude (optional)
   */
  async autocomplete(
    query: string,
    latitude?: number,
    longitude?: number
  ): Promise<GalliAutocompleteResult[]> {
    try {
      const url = `${NOMINATIM_BASE_URL}/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;

      const response = await fetch(url, { headers: NOMINATIM_HEADERS });
      const data = await response.json();

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => ({
        name: item.display_name?.split(',')?.[0] || item.name || '',
        address: item.display_name || '',
        latitude: parseFloat(item.lat) || 0,
        longitude: parseFloat(item.lon) || 0,
        placeId: String(item.place_id || ''),
        type: item.type || 'place',
      }));
    } catch (error) {
      console.error('Nominatim Autocomplete Error:', error);
      return [];
    }
  }

  /**
   * Search for a place by current location
   * @param latitude Latitude
   * @param longitude Longitude
   */
  async searchByLocation(
    latitude: number,
    longitude: number
  ): Promise<GalliAutocompleteResult[]> {
    try {
      const url = `${NOMINATIM_BASE_URL}/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`;

      const response = await fetch(url, { headers: NOMINATIM_HEADERS });
      const data = await response.json();

      if (!data || data.error) {
        throw new Error(data?.error || 'Search by location failed');
      }

      return [
        {
          name: data.display_name?.split(',')?.[0] || 'Current Location',
          address: data.display_name || 'Current Location',
          latitude: parseFloat(data.lat) || latitude,
          longitude: parseFloat(data.lon) || longitude,
          placeId: String(data.place_id || ''),
          type: data.type || 'place',
        },
      ];
    } catch (error) {
      console.error('Nominatim Search By Location Error:', error);
      return [];
    }
  }

  /**
   * Reverse geocode - get address from coordinates
   * @param latitude Latitude
   * @param longitude Longitude
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GalliLocation | null> {
    try {
      const url = `${NOMINATIM_BASE_URL}/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`;

      const response = await fetch(url, { headers: NOMINATIM_HEADERS });
      const data = await response.json();

      if (!data || data.error) {
        throw new Error(data?.error || 'Reverse geocode failed');
      }

      return {
        name: data.display_name?.split(',')?.[0] || 'Unknown Location',
        address: data.display_name || 'Unknown Address',
        latitude: parseFloat(data.lat) || latitude,
        longitude: parseFloat(data.lon) || longitude,
        placeId: String(data.place_id || ''),
        type: data.type || 'address',
      };
    } catch (error) {
      console.error('Nominatim Reverse Geocode Error:', error);
      return null;
    }
  }

  /**
   * Get route between two points
   * @param originLat Origin latitude
   * @param originLng Origin longitude
   * @param destLat Destination latitude
   * @param destLng Destination longitude
   */
  async getRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<GalliRouteResult | null> {
    try {
      const url = `${OSRM_BASE_URL}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code && data.code !== 'Ok') {
        throw new Error(data.message || 'Routing failed');
      }

      const route = data.routes?.[0];
      if (!route) return null;

      const coordinates: [number, number][] = (route.geometry?.coordinates || []).map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      return {
        distance: route.distance || 0,
        duration: route.duration || 0,
        geometry: {
          coordinates,
          type: 'LineString',
        },
      };
    } catch (error) {
      console.error('OSRM Routing Error:', error);
      return null;
    }
  }

  /**
   * Get distance and duration between two points
   * @param originLat Origin latitude
   * @param originLng Origin longitude
   * @param destLat Destination latitude
   * @param destLng Destination longitude
   */
  async getDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<GalliDistanceResult | null> {
    try {
      const url = `${OSRM_BASE_URL}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code && data.code !== 'Ok') {
        throw new Error(data.message || 'Distance calculation failed');
      }

      const route = data.routes?.[0];
      if (!route) return null;

      return {
        distance: route.distance || 0,
        duration: route.duration || 0,
      };
    } catch (error) {
      console.error('OSRM Distance Error:', error);
      return null;
    }
  }

  /**
   * Decode polyline geometry to coordinates
   * @param encoded Encoded polyline string
   */
  decodePolyline(encoded: string): [number, number][] {
    const coordinates: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push([lat / 1e5, lng / 1e5]);
    }

    return coordinates;
  }

  /**
   * Format distance for display
   * @param meters Distance in meters
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }

  /**
   * Format duration for display
   * @param seconds Duration in seconds
   */
  formatDuration(seconds: number): string {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    if (seconds >= 60) {
      return `${Math.floor(seconds / 60)} min`;
    }
    return `${Math.round(seconds)} sec`;
  }
}

export const galliMapsService = new GalliMapsService();
