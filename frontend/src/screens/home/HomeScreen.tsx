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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  Menu,
  MapPin,
  Navigation,
  Search,
  ChevronRight,
  Car,
  LocateFixed,
  Bike,
} from 'lucide-react-native';
import { useLocationStore, useRideStore, useAuthStore, usePreferencesStore } from '../../store';
import { socketManager, galliMapsService, rideService } from '../../services';
import { Colors } from '../../config/colors';
import { MAP_CONFIG } from '../../config/constants';
import { OSMMap, OSMMarker } from '../../components/ui';
import { Ride } from '../../types';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);

  const {
    currentLocation,
    pickupLocation,
    dropLocation,
    setCurrentLocation,
    setPickupLocation,
  } = useLocationStore();

  const { nearbyRiders, setNearbyRiders, setCurrentRide } = useRideStore();
  const { user } = useAuthStore();
  const { savedPlaces } = usePreferencesStore();
  const isRider = user?.role === 'rider';

  const [onDuty, setOnDuty] = useState(false);
  const [rideOffers, setRideOffers] = useState<Ride[]>([]);
  const [selectedService, setSelectedService] = useState('ride');
  const [selectedOffer, setSelectedOffer] = useState('ride');
  const [offerFare] = useState(268);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  const serviceOptions = [
    { id: 'moto', label: 'Moto', icon: '🏍️' },
    { id: 'ride', label: 'Ride', icon: '🚗' },
    { id: 'comfort', label: 'Comfort', icon: '🚙' },
    { id: 'delivery', label: 'Delivery', icon: '📦' },
    { id: 'city', label: 'City to city', icon: '🧳' },
  ];

  const quickPlaces = [
    ...(savedPlaces.home ? [{ id: 'home', name: 'Home', subtitle: savedPlaces.home }] : []),
    ...(savedPlaces.work ? [{ id: 'work', name: 'Work', subtitle: savedPlaces.work }] : []),
  ];

  useEffect(() => {
    requestLocationPermission();
    connectSocket();

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
  }, [isRider]);

  useEffect(() => {
    if (!isRider && currentLocation) {
      socketManager.subscribeToZone(currentLocation);
    }
  }, [currentLocation, isRider]);

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
    if (currentLocation && Platform.OS !== 'android') {
      mapRef.current?.animateToRegion({
        ...currentLocation,
        latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
        longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
      });
    }
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
      navigation.navigate('RideTracking', { rideId: response.ride._id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept ride');
    }
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
      markers.push({
        latitude: rider.coords.latitude,
        longitude: rider.coords.longitude,
        title: 'Nearby driver',
        emoji: index % 2 === 0 ? '🚗' : '🏍️',
        emojiSize: 20,
      });
    });

    return markers;
  }, [pickupLocation, dropLocation, nearbyRiders]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {Platform.OS === 'android' ? (
        <OSMMap
          center={currentLocation || {
            latitude: MAP_CONFIG.DEFAULT_LATITUDE,
            longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
          }}
          markers={osmMarkers}
          fitBounds
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
              <View className="w-10 h-10 bg-secondary rounded-full items-center justify-center shadow-lg">
                <Text className="text-xl">{index % 2 === 0 ? '🚗' : '🏍️'}</Text>
              </View>
            </Marker>
          ))}
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

      <SafeAreaView className="absolute bottom-0 left-0 right-0">
        <View className="px-4 pb-4">
          <View className="bg-white rounded-3xl shadow-lg p-4">
            {isRider ? (
              <>
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-lg font-semibold text-secondary">Driver Mode</Text>
                    <Text className="text-sm text-gray-500">Go online to receive ride requests</Text>
                  </View>
                  <Switch
                    value={onDuty}
                    onValueChange={handleToggleDuty}
                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-500 mb-2">Offers</Text>
                  {['moto', 'ride', 'comfort'].map((option) => {
                    const label = option === 'moto' ? 'Moto' : option === 'ride' ? 'Ride' : 'Comfort';
                    const icon = option === 'moto' ? '🏍️' : option === 'ride' ? '🚗' : '🚙';
                    return (
                      <TouchableOpacity
                        key={option}
                        className={`flex-row items-center bg-gray-50 rounded-2xl p-3 mb-3 ${
                          selectedOffer === option ? 'border border-primary' : 'border border-transparent'
                        }`}
                        onPress={() => setSelectedOffer(option)}
                        activeOpacity={0.8}
                      >
                        <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-3">
                          <Text className="text-2xl">{icon}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-secondary">{label}</Text>
                          <Text className="text-sm text-gray-500">Affordable fares</Text>
                        </View>
                        <Text className="text-base font-semibold text-secondary">~NPR{offerFare}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {rideOffers.length > 0 && (
                    <View className="mt-2">
                      {rideOffers.map((ride) => (
                        <View key={ride._id} className="bg-gray-50 rounded-xl p-3 mb-2">
                          <Text className="text-sm text-secondary" numberOfLines={1}>
                            {ride.pickup.address} → {ride.drop.address}
                          </Text>
                          <View className="flex-row items-center justify-between mt-2">
                            <Text className="text-sm font-semibold text-secondary">NPR {Math.round(ride.fare)}</Text>
                            <TouchableOpacity
                              className="bg-primary px-3 py-2 rounded-lg"
                              onPress={() => handleAcceptRide(ride._id)}
                            >
                              <Text className="text-sm font-medium text-secondary">Accept</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-2 mb-3"
                  contentContainerStyle={{ paddingHorizontal: 8 }}
                >
                  {serviceOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setSelectedService(option.id)}
                      className={`items-center mr-3 px-4 py-3 rounded-2xl ${
                        selectedService === option.id ? 'bg-primary/20' : 'bg-gray-50'
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text className="text-2xl mb-1">{option.icon}</Text>
                      <Text className="text-sm font-medium text-secondary">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  onPress={handleWhereToPress}
                  className="flex-row items-center bg-gray-100 rounded-2xl p-4 mb-3"
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-3">
                    <Search size={20} color={Colors.secondary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg text-gray-500">Where to?</Text>
                  </View>
                  <ChevronRight size={24} color={Colors.gray400} />
                </TouchableOpacity>

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

                <View className="flex-row items-center justify-between mt-3">
                  <TouchableOpacity onPress={handleWhereToPress} className="items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                      <Search size={20} color={Colors.secondary} />
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">Search</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleMyLocation} className="items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                      <LocateFixed size={20} color={Colors.primary} />
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">Location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('LocationSearch', { type: 'drop' })}
                    className="items-center flex-1"
                  >
                    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                      <Car size={20} color={Colors.secondary} />
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">Vehicles</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;
