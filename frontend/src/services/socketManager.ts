import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { useAuthStore } from '../store';
import { Coordinates, Ride, RiderInfo } from '../types';

class SocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  // Connect to socket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { tokens } = useAuthStore.getState();
      
      if (!tokens?.access_token) {
        reject(new Error('No access token available'));
        return;
      }

      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(SOCKET_URL, {
        extraHeaders: {
          access_token: tokens.access_token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      this.socket.on('error', (data: { message: string }) => {
        console.error('Socket error:', data.message);
        this.emit('error', data);
      });
    });
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Emit event
  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }

  // Add listener
  on<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Also add to socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
      this.socket?.off(event, callback);
    };
  }

  // Remove all listeners for an event
  off(event: string): void {
    this.listeners.delete(event);
    this.socket?.off(event);
  }

  // ==================== CUSTOMER EVENTS ====================

  // Subscribe to nearby riders updates
  subscribeToZone(coords: Coordinates): void {
    this.socket?.emit('subscribeToZone', coords);
  }

  // Search for a rider for a specific ride
  searchRider(rideId: string): void {
    this.socket?.emit('searchrider', rideId);
  }

  // Cancel current ride
  cancelRide(): void {
    this.socket?.emit('cancelRide');
  }

  // Subscribe to rider location updates
  subscribeToRiderLocation(riderId: string): void {
    this.socket?.emit('subscribeToriderLocation', riderId);
  }

  // Subscribe to ride updates
  subscribeToRide(rideId: string): void {
    this.socket?.emit('subscribeRide', rideId);
  }

  // ==================== RIDER EVENTS ====================

  // Go on duty (start accepting rides)
  goOnDuty(coords: Coordinates): void {
    this.socket?.emit('goOnDuty', coords);
  }

  // Go off duty (stop accepting rides)
  goOffDuty(): void {
    this.socket?.emit('goOffDuty');
  }

  // Update rider location
  updateLocation(coords: Coordinates): void {
    this.socket?.emit('updateLocation', coords);
  }

  // ==================== SOCKET LISTENERS ====================

  // Listen for nearby riders
  onNearbyRiders(callback: (riders: RiderInfo[]) => void): () => void {
    return this.on('nearbyriders', callback);
  }

  // Listen for ride offers (for riders)
  onRideOffer(callback: (ride: Ride) => void): () => void {
    return this.on('rideOffer', callback);
  }

  // Listen for ride updates
  onRideUpdate(callback: (ride: Ride) => void): () => void {
    return this.on('rideUpdate', callback);
  }

  // Listen for ride accepted
  onRideAccepted(callback: () => void): () => void {
    return this.on('rideAccepted', callback);
  }

  // Listen for ride canceled
  onRideCanceled(callback: (data: { message: string }) => void): () => void {
    return this.on('rideCanceled', callback);
  }

  // Listen for rider location updates
  onRiderLocationUpdate(callback: (data: { riderId: string; coords: Coordinates }) => void): () => void {
    return this.on('riderLocationUpdate', callback);
  }

  // Listen for ride data
  onRideData(callback: (ride: Ride) => void): () => void {
    return this.on('rideData', callback);
  }

  // Listen for errors
  onError(callback: (data: { message: string }) => void): () => void {
    return this.on('error', callback);
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager;
