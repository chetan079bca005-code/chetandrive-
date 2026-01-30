import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Clock,
  CreditCard,
  ChevronRight,
} from 'lucide-react-native';
import { useLocationStore, useRideStore } from '../../store';
import { rideService, galliMapsService } from '../../services';
import { Button, VehicleCard, OSMMap, OSMMarker, OSMPolyline } from '../../components/ui';
import { Colors } from '../../config/colors';
import { VehicleOption } from '../../types';
import { MAP_CONFIG } from '../../config/constants';

const { width, height } = Dimensions.get('window');

const vehicleOptions: VehicleOption[] = [
  {
    id: 'bike',
    name: 'Moto',
    description: 'No traffic, lower prices',
    icon: '🏍️',
    multiplier: 1,
    seats: 1,
    eta: '2 min',
  },
  {
    id: 'cabEconomy',
    name: 'Ride',
    description: 'Affordable fares',
    icon: '🚗',
    multiplier: 2,
    seats: 4,
    eta: '2 min',
  },
  {
    id: 'cabPremium',
    name: 'Comfort',
    description: 'Newer cars with AC',
    icon: '🚙',
    multiplier: 3,
    seats: 4,
    eta: '3 min',
  },
];

export const RideConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const mapRef = useRef<MapView>(null);

  const { pickupLocation, dropLocation } = useLocationStore();
  const {
    selectedVehicle,
    setSelectedVehicle,
    fareEstimate,
    setFareEstimate,
    setCurrentRide,
  } = useRideStore();

  const [isLoading, setIsLoading] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [offerFare, setOfferFare] = useState(0);

  useEffect(() => {
    calculateRouteAndFare();
    if (Platform.OS !== 'android') {
      fitMapToRoute();
    }
  }, [pickupLocation, dropLocation]);

  const calculateRouteAndFare = async () => {
    if (pickupLocation.coordinates && dropLocation.coordinates) {
      try {
        const route = await galliMapsService.getRoute(
          pickupLocation.coordinates.latitude,
          pickupLocation.coordinates.longitude,
          dropLocation.coordinates.latitude,
          dropLocation.coordinates.longitude
        );

        if (route) {
          const distKm = route.distance / 1000;
          setDistance(Math.round(distKm * 10) / 10);
          setDuration(Math.round(route.duration / 60));

          if (route.geometry?.coordinates?.length > 0) {
            const coords = route.geometry.coordinates.map(([lat, lng]) => ({
              latitude: lat,
              longitude: lng,
            }));
            setRouteCoordinates(coords);
          }

          const fares = rideService.calculateFare(distKm);
          setFareEstimate(fares);
          setOfferFare(Math.round(fares[selectedVehicle] || 0));
          return;
        }
      } catch (error) {
        console.error('Route error:', error);
      }

      const dist = rideService.calculateDistance(
        pickupLocation.coordinates.latitude,
        pickupLocation.coordinates.longitude,
        dropLocation.coordinates.latitude,
        dropLocation.coordinates.longitude
      );
      setDistance(dist);
      setDuration(Math.round(dist * 3));

      setRouteCoordinates(getSimpleRouteCoordinates());

      const fares = rideService.calculateFare(dist);
      setFareEstimate(fares);
      setOfferFare(Math.round(fares[selectedVehicle] || 0));
    }
  };

  const fitMapToRoute = () => {
    if (pickupLocation.coordinates && dropLocation.coordinates) {
      const coordinates = [pickupLocation.coordinates, dropLocation.coordinates];
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  const handleBookRide = async () => {
    if (!pickupLocation.coordinates || !dropLocation.coordinates) {
      Alert.alert('Error', 'Please select pickup and drop locations');
      return;
    }

    setIsLoading(true);

    try {
      // Navigate to Driver Offers screen to show incoming offers
      navigation.navigate('DriverOffers', {
        proposedFare: offerFare,
        distance,
        duration,
        routeCoordinates,
      });

      // Also create ride request in background
      const response = await rideService.createRide({
        vehicle: selectedVehicle,
        pickup: {
          address: pickupLocation.address,
          latitude: pickupLocation.coordinates.latitude,
          longitude: pickupLocation.coordinates.longitude,
        },
        drop: {
          address: dropLocation.address,
          latitude: dropLocation.coordinates.latitude,
          longitude: dropLocation.coordinates.longitude,
        },
      });

      setCurrentRide(response.ride);
    } catch (error: any) {
      // Don't show error here since we already navigated to offers screen
      console.error('Create ride error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSimpleRouteCoordinates = () => {
    if (!pickupLocation.coordinates || !dropLocation.coordinates) return [];

    const pickup = pickupLocation.coordinates;
    const drop = dropLocation.coordinates;

    const midLat = (pickup.latitude + drop.latitude) / 2;
    const midLng = (pickup.longitude + drop.longitude) / 2;
    const offset = 0.005;

    return [
      pickup,
      { latitude: midLat + offset, longitude: midLng - offset },
      drop,
    ];
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
    return markers;
  }, [pickupLocation, dropLocation]);

  const osmPolyline: OSMPolyline | undefined = useMemo(() => {
    const coords = routeCoordinates.length > 0 ? routeCoordinates : getSimpleRouteCoordinates();
    if (!coords.length) return undefined;
    return {
      coordinates: coords,
      color: Colors.routeColor,
      weight: 4,
    };
  }, [routeCoordinates]);

  useEffect(() => {
    if (fareEstimate && selectedVehicle) {
      setOfferFare(Math.round(fareEstimate[selectedVehicle] || 0));
    }
  }, [fareEstimate, selectedVehicle]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {Platform.OS === 'android' ? (
        <OSMMap
          center={pickupLocation.coordinates || {
            latitude: MAP_CONFIG.DEFAULT_LATITUDE,
            longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
          }}
          markers={osmMarkers}
          polyline={osmPolyline}
          fitBounds
          style={{ height: '45%' }}
        />
      ) : (
        <MapView
          ref={mapRef}
          className="h-[45%]"
          initialRegion={{
            latitude: pickupLocation.coordinates?.latitude || MAP_CONFIG.DEFAULT_LATITUDE,
            longitude: pickupLocation.coordinates?.longitude || MAP_CONFIG.DEFAULT_LONGITUDE,
            latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
            longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Polyline
            coordinates={routeCoordinates.length > 0 ? routeCoordinates : getSimpleRouteCoordinates()}
            strokeColor={Colors.routeColor}
            strokeWidth={4}
          />

          {pickupLocation.coordinates && (
            <Marker coordinate={pickupLocation.coordinates}>
              <View className="items-center">
                <View className="w-10 h-10 bg-success rounded-full items-center justify-center shadow-lg">
                  <Navigation size={20} color={Colors.white} />
                </View>
              </View>
            </Marker>
          )}

          {dropLocation.coordinates && (
            <Marker coordinate={dropLocation.coordinates}>
              <View className="items-center">
                <View className="w-10 h-10 bg-danger rounded-full items-center justify-center shadow-lg">
                  <MapPin size={20} color={Colors.white} />
                </View>
              </View>
            </Marker>
          )}
        </MapView>
      )}

      <SafeAreaView className="absolute top-0 left-0">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="m-4 w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
        >
          <ArrowLeft size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </SafeAreaView>

      <View className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-2xl">
        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3 mb-4" />

        <View className="px-4 mb-4">
          <View className="flex-row items-center">
            <View className="flex-row items-center flex-1">
              <Clock size={16} color={Colors.gray500} />
              <Text className="text-gray-500 ml-1">{distance} km • {duration} min</Text>
            </View>
            <View className="flex-row items-center">
              <CreditCard size={16} color={Colors.gray500} />
              <Text className="text-gray-500 ml-1">Cash / eSewa / Khalti</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity className="mx-4 mb-4 flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">🎟️</Text>
            <Text className="text-sm text-secondary">Got promo code? Use it here</Text>
          </View>
          <ChevronRight size={18} color={Colors.gray400} />
        </TouchableOpacity>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <Text className="text-lg font-semibold text-secondary mb-3">
            Choose your ride
          </Text>

          {vehicleOptions.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              id={vehicle.id}
              name={vehicle.name}
              description={vehicle.description}
              fare={Math.round(fareEstimate?.[vehicle.id] || 0)}
              eta={vehicle.eta}
              seats={vehicle.seats}
              isSelected={selectedVehicle === vehicle.id}
              onSelect={setSelectedVehicle}
              offerFare={selectedVehicle === vehicle.id ? offerFare : undefined}
              onOfferFareChange={selectedVehicle === vehicle.id ? setOfferFare : undefined}
              showOfferSection={true}
            />
          ))}
        </ScrollView>

        <View className="px-4 pb-6 pt-4 border-t border-gray-100">
          <Button
            title={`Book ${vehicleOptions.find((v) => v.id === selectedVehicle)?.name} • NPR${offerFare || Math.round(fareEstimate?.[selectedVehicle] || 0)}`}
            onPress={handleBookRide}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>
      </View>
    </View>
  );
};

export default RideConfirmationScreen;
