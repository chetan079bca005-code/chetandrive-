import api from './api';
import { Ride, CreateRideRequest, CreateRideResponse, VehicleType } from '../types';

interface AcceptRideResponse {
  message: string;
  ride: Ride;
}

interface UpdateStatusRequest {
  status: 'START' | 'ARRIVED' | 'COMPLETED';
}

interface MyRidesResponse {
  message: string;
  count: number;
  rides: Ride[];
}

export const rideService = {
  // Create a new ride
  async createRide(data: CreateRideRequest): Promise<CreateRideResponse> {
    const response = await api.post<CreateRideResponse>('/ride/create', data);
    return response.data;
  },
  
  // Accept a ride (for riders)
  async acceptRide(rideId: string): Promise<AcceptRideResponse> {
    const response = await api.patch<AcceptRideResponse>(`/ride/accept/${rideId}`);
    return response.data;
  },
  
  // Update ride status
  async updateRideStatus(rideId: string, data: UpdateStatusRequest): Promise<AcceptRideResponse> {
    const response = await api.patch<AcceptRideResponse>(`/ride/update/${rideId}`, data);
    return response.data;
  },
  
  // Get user's rides
  async getMyRides(status?: string): Promise<MyRidesResponse> {
    const params = status ? { status } : {};
    const response = await api.get<MyRidesResponse>('/ride/rides', { params });
    return response.data;
  },
  
  // Calculate fare estimate (client-side calculation matching backend)
  calculateFare(distance: number): { [key in VehicleType]: number } {
    const rateStructure = {
      bike: { baseFare: 10, perKmRate: 5, minimumFare: 25 },
      auto: { baseFare: 15, perKmRate: 7, minimumFare: 30 },
      cabEconomy: { baseFare: 20, perKmRate: 10, minimumFare: 50 },
      cabPremium: { baseFare: 30, perKmRate: 15, minimumFare: 70 },
    };
    
    const calculateVehicleFare = (baseFare: number, perKmRate: number, minimumFare: number) => {
      const calculatedFare = baseFare + distance * perKmRate;
      return Math.round(Math.max(calculatedFare, minimumFare));
    };
    
    return {
      bike: calculateVehicleFare(
        rateStructure.bike.baseFare,
        rateStructure.bike.perKmRate,
        rateStructure.bike.minimumFare
      ),
      auto: calculateVehicleFare(
        rateStructure.auto.baseFare,
        rateStructure.auto.perKmRate,
        rateStructure.auto.minimumFare
      ),
      cabEconomy: calculateVehicleFare(
        rateStructure.cabEconomy.baseFare,
        rateStructure.cabEconomy.perKmRate,
        rateStructure.cabEconomy.minimumFare
      ),
      cabPremium: calculateVehicleFare(
        rateStructure.cabPremium.baseFare,
        rateStructure.cabPremium.perKmRate,
        rateStructure.cabPremium.minimumFare
      ),
    };
  },
  
  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  },
};

export default rideService;
