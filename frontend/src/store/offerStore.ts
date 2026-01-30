import { create } from 'zustand';
import { DriverOffer, RideRequest, CounterOffer } from '../types';

interface OfferState {
  // Current ride request
  currentRequest: RideRequest | null;
  
  // Driver offers received
  driverOffers: DriverOffer[];
  
  // Selected offer for viewing/accepting
  selectedOffer: DriverOffer | null;
  
  // Search state
  isSearching: boolean;
  searchTimer: number; // seconds remaining
  
  // Actions
  setCurrentRequest: (request: RideRequest | null) => void;
  addOffer: (offer: DriverOffer) => void;
  updateOffer: (offerId: string, updates: Partial<DriverOffer>) => void;
  removeOffer: (offerId: string) => void;
  setSelectedOffer: (offer: DriverOffer | null) => void;
  setSearching: (searching: boolean) => void;
  setSearchTimer: (seconds: number) => void;
  acceptOffer: (offerId: string) => void;
  rejectOffer: (offerId: string) => void;
  counterOffer: (offerId: string, amount: number, message?: string) => void;
  clearOffers: () => void;
  reset: () => void;
}

export const useOfferStore = create<OfferState>((set, get) => ({
  currentRequest: null,
  driverOffers: [],
  selectedOffer: null,
  isSearching: false,
  searchTimer: 300, // 5 minutes default
  
  setCurrentRequest: (currentRequest) => set({ currentRequest }),
  
  addOffer: (offer) => set((state) => {
    // Avoid duplicates
    if (state.driverOffers.find(o => o._id === offer._id)) {
      return state;
    }
    return { driverOffers: [...state.driverOffers, offer] };
  }),
  
  updateOffer: (offerId, updates) => set((state) => ({
    driverOffers: state.driverOffers.map(offer =>
      offer._id === offerId ? { ...offer, ...updates } : offer
    ),
    selectedOffer: state.selectedOffer?._id === offerId
      ? { ...state.selectedOffer, ...updates }
      : state.selectedOffer,
  })),
  
  removeOffer: (offerId) => set((state) => ({
    driverOffers: state.driverOffers.filter(offer => offer._id !== offerId),
    selectedOffer: state.selectedOffer?._id === offerId ? null : state.selectedOffer,
  })),
  
  setSelectedOffer: (selectedOffer) => set({ selectedOffer }),
  
  setSearching: (isSearching) => set({ isSearching }),
  
  setSearchTimer: (searchTimer) => set({ searchTimer }),
  
  acceptOffer: (offerId) => set((state) => ({
    driverOffers: state.driverOffers.map(offer =>
      offer._id === offerId
        ? { ...offer, status: 'accepted' as const }
        : { ...offer, status: 'rejected' as const }
    ),
  })),
  
  rejectOffer: (offerId) => set((state) => ({
    driverOffers: state.driverOffers.map(offer =>
      offer._id === offerId
        ? { ...offer, status: 'rejected' as const }
        : offer
    ),
  })),
  
  counterOffer: (offerId, amount, message) => set((state) => {
    const newCounterOffer: CounterOffer = {
      _id: `counter_${Date.now()}`,
      from: 'passenger',
      amount,
      message,
      createdAt: new Date().toISOString(),
    };
    
    return {
      driverOffers: state.driverOffers.map(offer =>
        offer._id === offerId
          ? {
              ...offer,
              status: 'countered' as const,
              counterOffers: [...(offer.counterOffers || []), newCounterOffer],
            }
          : offer
      ),
    };
  }),
  
  clearOffers: () => set({
    driverOffers: [],
    selectedOffer: null,
    isSearching: false,
  }),
  
  reset: () => set({
    currentRequest: null,
    driverOffers: [],
    selectedOffer: null,
    isSearching: false,
    searchTimer: 300,
  }),
}));
