import { create } from 'zustand';
import { Coordinates } from '../types';
import { MAP_CONFIG } from '../config/constants';

interface LocationState {
  currentLocation: Coordinates | null;
  pickupLocation: {
    coordinates: Coordinates | null;
    address: string;
  };
  dropLocation: {
    coordinates: Coordinates | null;
    address: string;
  };
  isLocationLoading: boolean;
  locationError: string | null;
  
  // Actions
  setCurrentLocation: (coords: Coordinates) => void;
  setPickupLocation: (coords: Coordinates | null, address: string) => void;
  setDropLocation: (coords: Coordinates | null, address: string) => void;
  setLocationLoading: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
  clearLocations: () => void;
  swapLocations: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: {
    latitude: MAP_CONFIG.DEFAULT_LATITUDE,
    longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
  },
  pickupLocation: {
    coordinates: null,
    address: '',
  },
  dropLocation: {
    coordinates: null,
    address: '',
  },
  isLocationLoading: false,
  locationError: null,
  
  setCurrentLocation: (coords) => set({ currentLocation: coords }),
  
  setPickupLocation: (coordinates, address) => set({
    pickupLocation: { coordinates, address },
  }),
  
  setDropLocation: (coordinates, address) => set({
    dropLocation: { coordinates, address },
  }),
  
  setLocationLoading: (isLocationLoading) => set({ isLocationLoading }),
  
  setLocationError: (locationError) => set({ locationError }),
  
  clearLocations: () => set({
    pickupLocation: { coordinates: null, address: '' },
    dropLocation: { coordinates: null, address: '' },
  }),
  
  swapLocations: () => {
    const { pickupLocation, dropLocation } = get();
    set({
      pickupLocation: dropLocation,
      dropLocation: pickupLocation,
    });
  },
}));
