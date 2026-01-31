import { create } from 'zustand';
import { Ride, VehicleType, RiderInfo, Coordinates, FareEstimate } from '../types';

interface RideState {
  currentRide: Ride | null;
  selectedVehicle: VehicleType;
  nearbyRiders: RiderInfo[];
  riderLocation: Coordinates | null;
  fareEstimate: FareEstimate | null;
  isSearchingRider: boolean;
  rideHistory: Ride[];
  serviceDetails: {
    delivery?: {
      packageType?: string;
      description?: string;
    };
    freight?: {
      vehicleCategory?: string;
      goodsDescription?: string;
      weight?: string;
      services?: string[];
    };
    intercity?: {
      fromCity?: string;
      toCity?: string;
      date?: string;
      passengers?: number;
    };
  };
  
  // Actions
  setCurrentRide: (ride: Ride | null) => void;
  setSelectedVehicle: (vehicle: VehicleType) => void;
  setNearbyRiders: (riders: RiderInfo[]) => void;
  setRiderLocation: (coords: Coordinates | null) => void;
  setFareEstimate: (estimate: FareEstimate | null) => void;
  setSearchingRider: (searching: boolean) => void;
  updateRideStatus: (status: Ride['status']) => void;
  setRideHistory: (rides: Ride[]) => void;
  setServiceDetails: (details: RideState['serviceDetails']) => void;
  clearServiceDetails: () => void;
  clearRide: () => void;
}

export const useRideStore = create<RideState>((set, get) => ({
  currentRide: null,
  selectedVehicle: 'cabEconomy',
  nearbyRiders: [],
  riderLocation: null,
  fareEstimate: null,
  isSearchingRider: false,
  rideHistory: [],
  serviceDetails: {},
  
  setCurrentRide: (currentRide) => set({ currentRide }),
  
  setSelectedVehicle: (selectedVehicle) => set({ selectedVehicle }),
  
  setNearbyRiders: (nearbyRiders) => set({ nearbyRiders }),
  
  setRiderLocation: (riderLocation) => set({ riderLocation }),
  
  setFareEstimate: (fareEstimate) => set({ fareEstimate }),
  
  setSearchingRider: (isSearchingRider) => set({ isSearchingRider }),
  
  updateRideStatus: (status) => {
    const { currentRide } = get();
    if (currentRide) {
      set({ currentRide: { ...currentRide, status } });
    }
  },
  
  setRideHistory: (rideHistory) => set({ rideHistory }),

  setServiceDetails: (serviceDetails) => set({ serviceDetails }),

  clearServiceDetails: () => set({ serviceDetails: {} }),
  
  clearRide: () => set({
    currentRide: null,
    riderLocation: null,
    isSearchingRider: false,
  }),
}));
