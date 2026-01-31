import api from './api';
import { Ride, CreateRideRequest, CreateRideResponse, VehicleType, DriverOffer } from '../types';

interface AcceptRideResponse {
  message: string;
  ride: Ride;
}

interface OfferResponse {
  message: string;
  offers: DriverOffer[];
}

interface UpdateStatusRequest {
  status: 'ACCEPTED' | 'ARRIVED' | 'START' | 'COMPLETED';
}

interface MyRidesResponse {
  message: string;
  count: number;
  rides: Ride[];
}

interface RateRideRequest {
  rating: number;
  feedbackTags?: string[];
  comment?: string;
  tip?: number;
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

  async verifyOtp(rideId: string, otp: string): Promise<AcceptRideResponse> {
    const response = await api.post<AcceptRideResponse>(`/ride/${rideId}/verify-otp`, { otp });
    return response.data;
  },
  
  // Get user's rides
  async getMyRides(status?: string): Promise<MyRidesResponse> {
    const params = status ? { status } : {};
    const response = await api.get<MyRidesResponse>('/ride/rides', { params });
    return response.data;
  },

  // Get offers for a ride
  async getRideOffers(rideId: string): Promise<OfferResponse> {
    const response = await api.get<OfferResponse>(`/ride/${rideId}/offers`);
    return response.data;
  },

  // Driver: create offer
  async createOffer(rideId: string, data: { offeredFare: number; eta?: number; distanceToPickup?: number }): Promise<OfferResponse> {
    const response = await api.post<OfferResponse>(`/ride/${rideId}/offer`, data);
    return response.data;
  },

  // Passenger/Driver: counter offer
  async counterOffer(rideId: string, offerId: string, data: { amount: number; message?: string }): Promise<OfferResponse> {
    const response = await api.post<OfferResponse>(`/ride/${rideId}/offer/${offerId}/counter`, data);
    return response.data;
  },

  // Passenger: accept offer
  async acceptOffer(rideId: string, offerId: string): Promise<AcceptRideResponse> {
    const response = await api.post<AcceptRideResponse>(`/ride/${rideId}/offer/${offerId}/accept`);
    return response.data;
  },

  // Passenger: reject offer
  async rejectOffer(rideId: string, offerId: string): Promise<OfferResponse> {
    const response = await api.post<OfferResponse>(`/ride/${rideId}/offer/${offerId}/reject`);
    return response.data;
  },

  async cancelRide(rideId: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/ride/${rideId}/cancel`);
    return response.data;
  },

  async rateRide(rideId: string, data: RateRideRequest): Promise<AcceptRideResponse> {
    const response = await api.post<AcceptRideResponse>(`/ride/${rideId}/rate`, data);
    return response.data;
  },
  
  // Calculate fare estimate (client-side calculation matching backend)
  calculateFare(distance: number): { [key in VehicleType]: number } {
    const rateStructure = {
      bike: { baseFare: 10, perKmRate: 5, minimumFare: 25 },
      auto: { baseFare: 15, perKmRate: 7, minimumFare: 30 },
      cabEconomy: { baseFare: 20, perKmRate: 10, minimumFare: 50 },
      cabPremium: { baseFare: 30, perKmRate: 15, minimumFare: 70 },
      pickupTruck: { baseFare: 200, perKmRate: 30, minimumFare: 400 },
      miniTruck: { baseFare: 350, perKmRate: 45, minimumFare: 700 },
      largeTruck: { baseFare: 600, perKmRate: 70, minimumFare: 1200 },
      containerTruck: { baseFare: 1000, perKmRate: 110, minimumFare: 2000 },
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
      pickupTruck: calculateVehicleFare(
        rateStructure.pickupTruck.baseFare,
        rateStructure.pickupTruck.perKmRate,
        rateStructure.pickupTruck.minimumFare
      ),
      miniTruck: calculateVehicleFare(
        rateStructure.miniTruck.baseFare,
        rateStructure.miniTruck.perKmRate,
        rateStructure.miniTruck.minimumFare
      ),
      largeTruck: calculateVehicleFare(
        rateStructure.largeTruck.baseFare,
        rateStructure.largeTruck.perKmRate,
        rateStructure.largeTruck.minimumFare
      ),
      containerTruck: calculateVehicleFare(
        rateStructure.containerTruck.baseFare,
        rateStructure.containerTruck.perKmRate,
        rateStructure.containerTruck.minimumFare
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
