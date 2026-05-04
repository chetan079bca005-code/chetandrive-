import Constants from 'expo-constants';

const getRuntimeBaseUrl = () => {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')?.[0];
  if (host) {
    return `http://${host}:3000`;
  }

  return 'http://localhost:3000';
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getRuntimeBaseUrl(),
  SOCKET_URL: getRuntimeBaseUrl(),
  GALLI_MAP_ACCESS_TOKEN: process.env.EXPO_PUBLIC_GALLI_MAP_ACCESS_TOKEN || '', // Legacy (unused with OSM)
  GALLI_MAP_BASE_URL: 'https://route-init.gallimap.com/api/v1', // Legacy (unused with OSM)
  NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org',
  OSRM_BASE_URL: 'https://router.project-osrm.org',
  NOMINATIM_USER_AGENT: process.env.EXPO_PUBLIC_NOMINATIM_USER_AGENT || 'ChetanDrive/1.0',
};

// Legacy exports for backward compatibility
export const API_URL = API_CONFIG.BASE_URL;
export const SOCKET_URL = API_CONFIG.SOCKET_URL;

// Map Configuration (Kathmandu as default for Nepal)
export const MAP_CONFIG = {
  DEFAULT_LATITUDE: 27.7172, // Kathmandu
  DEFAULT_LONGITUDE: 85.3240,
  LATITUDE_DELTA: 0.0922,
  LONGITUDE_DELTA: 0.0421,
  OSM_TILE_URL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  OSM_MAX_ZOOM: 19,
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'ChetanDrive',
  VERSION: '1.0.0',
  OTP_LENGTH: 4,
};

// Vehicle Types
export const VEHICLE_TYPES = {
  BIKE: 'bike',
  AUTO: 'auto',
  CAB_ECONOMY: 'cabEconomy',
  CAB_PREMIUM: 'cabPremium',
} as const;

// Ride Status
export const RIDE_STATUS = {
  SEARCHING: 'SEARCHING_FOR_RIDER',
  ACCEPTED: 'ACCEPTED',
  START: 'START',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED',
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  RIDER: 'rider',
} as const;
