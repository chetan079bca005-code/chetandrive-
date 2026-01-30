// Types for the Ride Booking App

export interface User {
  _id: string;
  phone: string;
  role: 'customer' | 'rider';
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Ride {
  _id: string;
  vehicle: VehicleType;
  distance: number;
  pickup: Location;
  drop: Location;
  fare: number;
  customer: User | string;
  rider: User | string | null;
  status: RideStatus;
  otp: string | null;
  createdAt: string;
  updatedAt: string;
}

export type VehicleType = 'bike' | 'auto' | 'cabEconomy' | 'cabPremium';

export type RideStatus = 'SEARCHING_FOR_RIDER' | 'START' | 'ARRIVED' | 'COMPLETED';

export interface VehicleOption {
  id: VehicleType;
  name: string;
  description: string;
  icon: string;
  multiplier: number;
  seats: number;
  eta: string;
}

export interface RiderInfo {
  socketId: string;
  coords: Coordinates;
  distance: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface CreateRideRequest {
  vehicle: VehicleType;
  pickup: Location;
  drop: Location;
}

export interface CreateRideResponse {
  message: string;
  ride: Ride;
}

export interface FareEstimate {
  bike: number;
  auto: number;
  cabEconomy: number;
  cabPremium: number;
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface SocketEvents {
  // Customer Events
  subscribeToZone: (coords: Coordinates) => void;
  searchrider: (rideId: string) => void;
  cancelRide: () => void;
  subscribeToriderLocation: (riderId: string) => void;
  subscribeRide: (rideId: string) => void;
  
  // Rider Events
  goOnDuty: (coords: Coordinates) => void;
  goOffDuty: () => void;
  updateLocation: (coords: Coordinates) => void;
}

export interface SocketListeners {
  nearbyriders: (riders: RiderInfo[]) => void;
  rideOffer: (ride: Ride) => void;
  rideUpdate: (ride: Ride) => void;
  rideAccepted: () => void;
  rideCanceled: (data: { message: string }) => void;
  riderLocationUpdate: (data: { riderId: string; coords: Coordinates }) => void;
  rideData: (ride: Ride) => void;
  error: (data: { message: string }) => void;
}

// ==================== DRIVER OFFER TYPES ====================

export interface DriverProfile {
  _id: string;
  name: string;
  phone: string;
  photo?: string;
  rating: number;
  totalRides: number;
  acceptanceRate: number;
  cancellationRate: number;
  memberSince: string;
  verificationBadges: string[];
  vehicle: VehicleDetails;
}

export interface VehicleDetails {
  type: VehicleType;
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  year: number;
  photo?: string;
  capacity: number;
}

export interface DriverOffer {
  _id: string;
  rideRequestId: string;
  driver: DriverProfile;
  offeredFare: number;
  originalFare: number;
  priceComparison: 'below' | 'equal' | 'above';
  eta: number; // minutes to pickup
  distance: number; // km to pickup
  expiresAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'countered';
  counterOffers?: CounterOffer[];
  createdAt: string;
}

export interface CounterOffer {
  _id: string;
  from: 'passenger' | 'driver';
  amount: number;
  message?: string;
  createdAt: string;
}

export interface RideRequest {
  _id: string;
  passenger: User;
  vehicle: VehicleType;
  pickup: Location;
  drop: Location;
  proposedFare: number;
  distance: number;
  duration: number;
  status: 'searching' | 'matched' | 'accepted' | 'cancelled';
  offers: DriverOffer[];
  expiresAt: string;
  createdAt: string;
}

// ==================== CHAT TYPES ====================

export interface ChatMessage {
  _id: string;
  rideId: string;
  senderId: string;
  senderType: 'passenger' | 'driver';
  content: string;
  type: 'text' | 'location' | 'image' | 'system';
  read: boolean;
  createdAt: string;
}

export interface QuickReply {
  id: string;
  text: string;
  icon?: string;
}

// ==================== RATING TYPES ====================

export interface RideRating {
  rideId: string;
  rating: number;
  feedbackTags: string[];
  comment?: string;
  tip?: number;
}

export interface FeedbackTag {
  id: string;
  label: string;
  icon: string;
  type: 'positive' | 'negative';
}

// ==================== SAFETY TYPES ====================

export interface EmergencyContact {
  _id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface TripShare {
  rideId: string;
  shareLink: string;
  sharedWith: string[];
  expiresAt: string;
}
