import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  Switch,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  Menu,
  MapPin,
  Navigation,
  ChevronRight,
  LocateFixed,
} from 'lucide-react-native';
import { useLocationStore, useRideStore, useAuthStore, usePreferencesStore } from '../../store';
import { socketManager, galliMapsService, rideService } from '../../services';
import { Colors } from '../../config/colors';
import { MAP_CONFIG } from '../../config/constants';
import { OSMMap, OSMMarker } from '../../components/ui';
import { Ride, RiderInfo, Coordinates } from '../../types';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const { height: screenHeight } = Dimensions.get('window');

  const {
    currentLocation,
    pickupLocation,
    dropLocation,
    setCurrentLocation,
    setPickupLocation,
  } = useLocationStore();

  const { nearbyRiders, setNearbyRiders, setCurrentRide, currentRide } = useRideStore();
  const { user, isAuthenticated, tokens } = useAuthStore();
  const { savedPlaces } = usePreferencesStore();
  const isRider = user?.role === 'rider';

  const [onDuty, setOnDuty] = useState(false);
  const [rideOffers, setRideOffers] = useState<Ride[]>([]);
  const [selectedService, setSelectedService] = useState('ride');
  const [selectedOffer, setSelectedOffer] = useState('ride');
  const [offerFare] = useState(268);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [selectedRideForOffer, setSelectedRideForOffer] = useState<Ride | null>(null);
  const [driverListVisible, setDriverListVisible] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [mapCenter, setMapCenter] = useState<Coordinates>({
    latitude: MAP_CONFIG.DEFAULT_LATITUDE,
    longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
  });
  const [mapZoom, setMapZoom] = useState(14);
  const [fitBounds, setFitBounds] = useState(true);
  const [simulatedLocation, setSimulatedLocation] = useState<Coordinates | null>(null);
  const simulationIndexRef = useRef(0);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  const serviceOptions: { id: string; label: string; icon: string }[] = [];

  const quickPlaces = [
    ...(savedPlaces.home ? [{ id: 'home', name: 'Home', subtitle: savedPlaces.home }] : []),
    ...(savedPlaces.work ? [{ id: 'work', name: 'Work', subtitle: savedPlaces.work }] : []),
  ];

  useEffect(() => {
    requestLocationPermission();
    if (isAuthenticated && (tokens?.access_token || tokens?.refresh_token)) {
      connectSocket();
    }

    const unsubscribeRideOffer = socketManager.onRideOffer((ride) => {
      if (isRider) {
        setRideOffers((prev) => {
          if (prev.find((r) => r._id === ride._id)) return prev;
          return [ride, ...prev];
        });
      }
    });

    return () => {
      unsubscribeRideOffer();
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
    };
  }, [isRider, isAuthenticated, tokens?.access_token, tokens?.refresh_token]);

  useEffect(() => {
    if (!isRider && currentLocation) {
      socketManager.subscribeToZone(currentLocation);
    }
  }, [currentLocation, isRider]);

  useEffect(() => {
    if (currentLocation) {
      setMapCenter({ ...currentLocation });
    }
  }, [currentLocation]);

  useEffect(() => {
    const calculateRoute = async () => {
      if (!pickupLocation.coordinates || !dropLocation.coordinates) {
        setRouteCoordinates([]);
        return;
      }

      try {
        const route = await galliMapsService.getRoute(
          pickupLocation.coordinates.latitude,
          pickupLocation.coordinates.longitude,
          dropLocation.coordinates.latitude,
          dropLocation.coordinates.longitude
        );

        if (route?.geometry?.coordinates?.length) {
          const coords = route.geometry.coordinates.map(([lat, lng]) => ({
            latitude: lat,
            longitude: lng,
          }));
          setRouteCoordinates(coords);
          setFitBounds(true);
          return;
        }
      } catch (error) {
        console.error('Route error:', error);
      }

      setRouteCoordinates(getSimpleRouteCoordinates());
      setFitBounds(true);
    };

    calculateRoute();
  }, [pickupLocation.coordinates, dropLocation.coordinates]);

  useEffect(() => {
    if (!pickupLocation.coordinates && !dropLocation.coordinates) return;

    if (Platform.OS === 'android') {
      const nextCenter = pickupLocation.coordinates || currentLocation || mapCenter;
      setMapCenter({ ...nextCenter });
      return;
    }

    const points = [pickupLocation.coordinates, dropLocation.coordinates].filter(Boolean) as Coordinates[];
    if (points.length === 1) {
      mapRef.current?.animateToRegion({
        ...points[0],
        latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
        longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
      });
    } else if (points.length > 1) {
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: { top: 120, right: 50, bottom: 220, left: 50 },
        animated: true,
      });
    }
  }, [pickupLocation.coordinates, dropLocation.coordinates, currentLocation]);

  useEffect(() => {
    const shouldSimulate = !isRider && currentRide?.status === 'START' && routeCoordinates.length > 1;
    if (!shouldSimulate) {
      setSimulatedLocation(null);
      simulationIndexRef.current = 0;
      return;
    }

    simulationIndexRef.current = 0;
    setSimulatedLocation(routeCoordinates[0]);

    const interval = setInterval(() => {
      simulationIndexRef.current += 1;
      if (simulationIndexRef.current >= routeCoordinates.length) {
        clearInterval(interval);
        return;
      }

      const next = routeCoordinates[simulationIndexRef.current];
      setSimulatedLocation(next);

      if (Platform.OS === 'android') {
        setMapCenter(next);
      } else {
        mapRef.current?.animateToRegion({
          ...next,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentRide?.status, isRider, routeCoordinates]);

  const getSimpleRouteCoordinates = () => {
    if (!pickupLocation.coordinates || !dropLocation.coordinates) return [];
    return [pickupLocation.coordinates, dropLocation.coordinates];
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location services to use this app.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);

      let formattedAddress = 'Current Location';
      try {
        const galliResult = await galliMapsService.reverseGeocode(
          coords.latitude,
          coords.longitude
        );
        if (galliResult) {
          formattedAddress = galliResult.name || galliResult.address || 'Current Location';
        }
      } catch {
        const [address] = await Location.reverseGeocodeAsync(coords);
        if (address) {
          formattedAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}`.trim() || 'Current Location';
        }
      }

      setPickupLocation(coords, formattedAddress);

      if (Platform.OS !== 'android') {
        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
          longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const connectSocket = async () => {
    try {
      await socketManager.connect();
      socketManager.onNearbyRiders((riders) => {
        setNearbyRiders(riders);
      });
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  };

  const handleWhereToPress = () => {
    navigation.navigate('LocationSearch', { type: 'drop' });
  };

  const handleMyLocation = () => {
    if (!currentLocation) return;
    if (Platform.OS === 'android') {
      setMapCenter({ ...currentLocation });
      setMapZoom(16);
      setFitBounds(false);
      return;
    }
    mapRef.current?.animateToRegion({
      ...currentLocation,
      latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
      longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
    });
  };

  const handleToggleDuty = async (value: boolean) => {
    if (!currentLocation) {
      Alert.alert('Location required', 'Enable location to go online.');
      return;
    }

    setOnDuty(value);

    if (value) {
      socketManager.goOnDuty(currentLocation);
      locationWatchRef.current?.remove();
      locationWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          socketManager.updateLocation(coords);
        }
      );
    } else {
      socketManager.goOffDuty();
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      const response = await rideService.acceptRide(rideId);
      setCurrentRide(response.ride);
      setRideOffers((prev) => prev.filter((ride) => ride._id !== rideId));
      navigation.navigate('DriverRide', { rideId: response.ride._id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept ride');
    }
  };

  const openDriverProfile = (rider: RiderInfo) => {
    if (!rider.profile) {
      Alert.alert('Driver', 'Profile details not available yet.');
      return;
    }

    const offer = {
      _id: `nearby_${rider.riderId || rider.socketId}`,
      rideRequestId: 'nearby',
      driver: rider.profile,
      offeredFare: 0,
      originalFare: 0,
      priceComparison: 'equal' as const,
      eta: Math.max(2, Math.round((rider.distance / 1000) * 3)),
      distance: Math.round((rider.distance / 1000) * 10) / 10,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    navigation.navigate('DriverProfile', { offer });
  };

  const handleOpenOffer = (ride: Ride) => {
    setSelectedRideForOffer(ride);
    setOfferAmount(Math.round(ride.fare || ride.proposedFare || 0).toString());
    setOfferModalVisible(true);
  };

  const handleSendOffer = () => {
    if (!selectedRideForOffer) return;
    const amount = parseInt(offerAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid offer amount');
      return;
    }

    socketManager.makeOffer({
      rideId: selectedRideForOffer._id,
      offeredFare: amount,
      eta: 5,
      distanceToPickup: 1.5,
    });

    Alert.alert('Offer Sent', 'Your offer has been sent to the passenger.');
    setOfferModalVisible(false);
  };

  const osmMarkers: OSMMarker[] = useMemo(() => {
    const markers: OSMMarker[] = [];

    if (pickupLocation.coordinates) {
      markers.push({
        latitude: pickupLocation.coordinates.latitude,
        longitude: pickupLocation.coordinates.longitude,
        title: pickupLocation.address,
        emoji: '📍',
        emojiSize: 22,
      });
    }

    if (dropLocation.coordinates) {
      markers.push({
        latitude: dropLocation.coordinates.latitude,
        longitude: dropLocation.coordinates.longitude,
        title: dropLocation.address,
        emoji: '🏁',
        emojiSize: 22,
      });
    }

    nearbyRiders.forEach((rider, index) => {
      const etaMin = Math.max(2, Math.round((rider.distance / 1000) * 3));
      markers.push({
        latitude: rider.coords.latitude,
        longitude: rider.coords.longitude,
        title: `Driver • ETA ${etaMin}m`,
        emoji: index % 2 === 0 ? '🚗' : '🏍️',
        emojiSize: 20,
      });
    });

    if (simulatedLocation) {
      markers.push({
        latitude: simulatedLocation.latitude,
        longitude: simulatedLocation.longitude,
        title: 'Ride in progress',
        emoji: '🚕',
        emojiSize: 22,
      });
    }

    return markers;
  }, [pickupLocation, dropLocation, nearbyRiders, simulatedLocation]);

  const osmPolyline = useMemo(() => {
    if (routeCoordinates.length < 2) return undefined;
    return {
      coordinates: routeCoordinates,
      color: Colors.routeColor,
      weight: 4,
    };
  }, [routeCoordinates]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {Platform.OS === 'android' ? (
        <OSMMap
          center={mapCenter}
          zoom={mapZoom}
          markers={osmMarkers}
          polyline={osmPolyline}
          fitBounds={fitBounds}
          style={{ flex: 1 }}
        />
      ) : (
        <MapView
          ref={mapRef}
          className="flex-1"
          initialRegion={{
            latitude: currentLocation?.latitude || MAP_CONFIG.DEFAULT_LATITUDE,
            longitude: currentLocation?.longitude || MAP_CONFIG.DEFAULT_LONGITUDE,
            latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
            longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={Colors.routeColor}
              strokeWidth={4}
            />
          )}

          {pickupLocation.coordinates && (
            <Marker coordinate={pickupLocation.coordinates} title="Pickup">
              <View className="items-center">
                <View className="w-10 h-10 bg-success rounded-full items-center justify-center shadow-lg">
                  <Navigation size={20} color={Colors.white} />
                </View>
                <View className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-success -mt-1" />
              </View>
            </Marker>
          )}

          {dropLocation.coordinates && (
            <Marker coordinate={dropLocation.coordinates} title="Drop">
              <View className="items-center">
                <View className="w-10 h-10 bg-danger rounded-full items-center justify-center shadow-lg">
                  <MapPin size={20} color={Colors.white} />
                </View>
                <View className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-danger -mt-1" />
              </View>
            </Marker>
          )}

          {nearbyRiders.map((rider, index) => (
            <Marker key={index} coordinate={rider.coords} title={`Driver ${index + 1}`}>
              <View className="items-center">
                <View className="bg-white px-2 py-1 rounded-full shadow-lg mb-1">
                  <Text className="text-[10px] text-secondary">
                    ETA {Math.max(2, Math.round((rider.distance / 1000) * 3))}m
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openDriverProfile(rider)}
                  className="w-10 h-10 bg-secondary rounded-full items-center justify-center shadow-lg"
                >
                  <Text className="text-xl">{index % 2 === 0 ? '🚗' : '🏍️'}</Text>
                </TouchableOpacity>
              </View>
            </Marker>
          ))}

          {simulatedLocation && (
            <Marker coordinate={simulatedLocation} title="Ride in progress">
              <View className="items-center">
                <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-lg">
                  <Text className="text-xl">🚕</Text>
                </View>
              </View>
            </Marker>
          )}
        </MapView>
      )}

      <SafeAreaView className="absolute top-0 left-0 right-0">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Menu size={24} color={Colors.secondary} />
            <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger border-2 border-white" />
          </TouchableOpacity>
          <View />
        </View>
      </SafeAreaView>

      {!isRider && (
        <TouchableOpacity
          onPress={handleMyLocation}
          className="absolute right-4 top-24 w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
        >
          <LocateFixed size={20} color={Colors.secondary} />
        </TouchableOpacity>
      )}

      <SafeAreaView className="absolute bottom-0 left-0 right-0">
        <View className="px-4 pb-4">
          <View className="bg-white rounded-3xl shadow-lg p-4">
            <ScrollView
              style={{ maxHeight: screenHeight * 0.45 }}
              showsVerticalScrollIndicator={false}
            >
              {isRider ? (
                <>
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-lg font-semibold text-secondary">Driver Mode</Text>
                    <Text className="text-sm text-gray-500">Go online to receive ride requests</Text>
                  </View>
                  <Switch value={onDuty} onValueChange={handleToggleDuty} />
                </View>

                {rideOffers.length === 0 ? (
                  <Text className="text-sm text-gray-500">No requests yet.</Text>
                ) : (
                  <View className="mt-2">
                    {rideOffers.map((ride) => (
                      <View key={ride._id} className="bg-gray-50 rounded-xl p-3 mb-2">
                        <Text className="text-sm text-secondary" numberOfLines={1}>
                          {ride.pickup.address} → {ride.drop.address}
                        </Text>
                        <View className="flex-row items-center justify-between mt-2">
                          <Text className="text-sm font-semibold text-secondary">NPR {Math.round(ride.fare)}</Text>
                          <View className="flex-row">
                            <TouchableOpacity
                              className="bg-gray-200 px-3 py-2 rounded-lg mr-2"
                              onPress={() => handleOpenOffer(ride)}
                            >
                              <Text className="text-sm font-medium text-secondary">Offer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="bg-primary px-3 py-2 rounded-lg"
                              onPress={() => handleAcceptRide(ride._id)}
                            >
                              <Text className="text-sm font-medium text-secondary">Accept</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                </>
              ) : (
                <>
                <TouchableOpacity
                  onPress={() => navigation.navigate('LocationSearch', { type: 'pickup' })}
                  className="flex-row items-center bg-gray-100 rounded-2xl p-4 mb-3"
                  activeOpacity={0.7}
                >
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Pickup</Text>
                    <Text className="text-base text-secondary" numberOfLines={1}>
                      {pickupLocation.address || 'Set pickup location'}
                    </Text>
                  </View>
                  <ChevronRight size={24} color={Colors.gray400} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleWhereToPress}
                  className="flex-row items-center bg-gray-100 rounded-2xl p-4 mb-3"
                  activeOpacity={0.7}
                >
                  <View className="flex-1">
                    <Text className="text-lg text-gray-500">Where to?</Text>
                  </View>
                  <ChevronRight size={24} color={Colors.gray400} />
                </TouchableOpacity>

                {nearbyRiders.length > 0 && (
                  <View className="bg-white rounded-2xl p-4 mb-3">
                    <Text className="text-sm font-semibold text-secondary mb-2">Nearby Drivers</Text>
                    {nearbyRiders.slice(0, 5).map((rider, index) => {
                      const distanceKm = Math.max(0.1, Math.round((rider.distance / 1000) * 10) / 10);
                      const etaMin = Math.max(2, Math.round(distanceKm * 3));
                      return (
                        <View key={index} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                          <View className="flex-row items-center">
                            <Text className="text-xl mr-2">{index % 2 === 0 ? '🚗' : '🏍️'}</Text>
                            <View>
                              <Text className="text-sm text-secondary">Driver {index + 1}</Text>
                              <Text className="text-xs text-gray-500">{distanceKm} km away</Text>
                            </View>
                          </View>
                          <Text className="text-xs text-gray-500">ETA {etaMin} min</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {quickPlaces.length > 0 && (
                  <View className="bg-white rounded-2xl p-2">
                    {quickPlaces.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        className="flex-row items-center px-3 py-2"
                        activeOpacity={0.7}
                        onPress={handleWhereToPress}
                      >
                        <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-3">
                          <Text className="text-lg">📍</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-secondary">{place.name}</Text>
                          <Text className="text-sm text-gray-500">{place.subtitle}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View className="flex-row items-center gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => setDriverListVisible(true)}
                    className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                  >
                    <Text className="text-sm font-semibold text-secondary">Nearby Drivers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleWhereToPress}
                    className="flex-1 bg-primary py-3 rounded-xl items-center"
                  >
                    <Text className="text-sm font-semibold text-secondary">Request Ride</Text>
                  </TouchableOpacity>
                </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={driverListVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDriverListVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl p-4 max-h-[60%]">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-secondary">Nearby Drivers</Text>
              <TouchableOpacity onPress={() => setDriverListVisible(false)}>
                <Text className="text-sm text-gray-500">Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {nearbyRiders.length === 0 && (
                <Text className="text-sm text-gray-500">No drivers nearby.</Text>
              )}
              {nearbyRiders.map((rider, index) => {
                const distanceKm = Math.max(0.1, Math.round((rider.distance / 1000) * 10) / 10);
                const etaMin = Math.max(2, Math.round(distanceKm * 3));
                return (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100"
                    onPress={() => openDriverProfile(rider)}
                  >
                    <View className="flex-row items-center">
                      <Text className="text-xl mr-2">{index % 2 === 0 ? '🚗' : '🏍️'}</Text>
                      <View>
                        <Text className="text-sm text-secondary">
                          {rider.profile?.name || `Driver ${index + 1}`}
                        </Text>
                        <Text className="text-xs text-gray-500">{distanceKm} km away</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-500">ETA {etaMin} min</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={offerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center">
          <View className="bg-white rounded-2xl p-4 w-[85%]">
            <Text className="text-base font-semibold text-secondary">Send Offer</Text>
            <Text className="text-xs text-gray-500 mt-1">
              Propose your fare to the passenger
            </Text>
            <TextInput
              value={offerAmount}
              onChangeText={setOfferAmount}
              keyboardType="numeric"
              placeholder="Enter offer amount"
              className="mt-3 border border-gray-200 rounded-xl px-3 py-2 text-secondary"
            />
            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                onPress={() => setOfferModalVisible(false)}
                className="px-4 py-2 mr-2"
              >
                <Text className="text-sm text-gray-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendOffer}
                className="bg-primary px-4 py-2 rounded-lg"
              >
                <Text className="text-sm font-semibold text-secondary">Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;
