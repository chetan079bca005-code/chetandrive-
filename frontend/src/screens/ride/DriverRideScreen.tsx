import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useRideStore, useLocationStore } from '../../store';
import { rideService, socketManager, galliMapsService } from '../../services';
import { Button, OSMMap, OSMMarker, OSMPolyline } from '../../components/ui';
import { Colors } from '../../config/colors';
import { MAP_CONFIG } from '../../config/constants';
import { Ride, Coordinates } from '../../types';

const { width, height } = Dimensions.get('window');

type RouteParams = {
  DriverRide: {
    rideId: string;
  };
};

export const DriverRideScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'DriverRide'>>();
  const { rideId } = route.params;
  const mapRef = useRef<MapView>(null);

  const { currentRide, setCurrentRide } = useRideStore();
  const { pickupLocation, dropLocation } = useLocationStore();

  const [otpInput, setOtpInput] = useState('');
  const [mapCenter, setMapCenter] = useState<Coordinates>({
    latitude: MAP_CONFIG.DEFAULT_LATITUDE,
    longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  const rideData = currentRide;

  useEffect(() => {
    socketManager.subscribeToRide(rideId);

    const unsubscribeRideUpdate = socketManager.onRideUpdate((ride: Ride) => {
      setCurrentRide(ride);
    });

    return () => {
      unsubscribeRideUpdate();
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
    };
  }, [rideId]);

  useEffect(() => {
    const startLocationUpdates = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setMapCenter(coords);
      socketManager.updateLocation(coords);

      locationWatchRef.current?.remove();
      locationWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          const update = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          socketManager.updateLocation(update);
        }
      );
    };

    startLocationUpdates();
  }, []);

  useEffect(() => {
    const calculateRoute = async () => {
      const pickup = rideData?.pickup
        ? { latitude: rideData.pickup.latitude, longitude: rideData.pickup.longitude }
        : pickupLocation.coordinates;
      const drop = rideData?.drop
        ? { latitude: rideData.drop.latitude, longitude: rideData.drop.longitude }
        : dropLocation.coordinates;

      if (!pickup || !drop) {
        setRouteCoordinates([]);
        return;
      }

      try {
        const route = await galliMapsService.getRoute(
          pickup.latitude,
          pickup.longitude,
          drop.latitude,
          drop.longitude
        );

        if (route?.geometry?.coordinates?.length) {
          const coords = route.geometry.coordinates.map(([lat, lng]) => ({
            latitude: lat,
            longitude: lng,
          }));
          setRouteCoordinates(coords);
          return;
        }
      } catch (error) {
        console.error('Route error:', error);
      }

      setRouteCoordinates([pickup, drop]);
    };

    calculateRoute();
  }, [rideData?.pickup, rideData?.drop, pickupLocation.coordinates, dropLocation.coordinates]);

  useEffect(() => {
    if (Platform.OS === 'android') return;
    if (routeCoordinates.length < 2) return;
    mapRef.current?.fitToCoordinates(routeCoordinates, {
      edgePadding: { top: 100, right: 50, bottom: 220, left: 50 },
      animated: true,
    });
  }, [routeCoordinates]);

  const handleArrived = async () => {
    if (!currentRide) return;
    try {
      await rideService.updateRideStatus(currentRide._id, { status: 'ARRIVED' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const handleVerifyOtp = async () => {
    if (!currentRide) return;
    if (!otpInput.trim()) {
      Alert.alert('OTP Required', 'Enter the OTP from the passenger');
      return;
    }
    try {
      await rideService.verifyOtp(currentRide._id, otpInput.trim());
      setOtpInput('');
    } catch (error: any) {
      Alert.alert('Invalid OTP', error.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleComplete = async () => {
    if (!currentRide) return;
    try {
      await rideService.updateRideStatus(currentRide._id, { status: 'COMPLETED' });
      navigation.replace('RideCompletion', { rideId: currentRide._id });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete ride');
    }
  };

  const osmMarkers: OSMMarker[] = [
    ...(rideData?.pickup
      ? [{
          latitude: rideData.pickup.latitude,
          longitude: rideData.pickup.longitude,
          title: 'Pickup',
          emoji: '📍',
          emojiSize: 22,
        }]
      : []),
    ...(rideData?.drop
      ? [{
          latitude: rideData.drop.latitude,
          longitude: rideData.drop.longitude,
          title: 'Drop',
          emoji: '🏁',
          emojiSize: 22,
        }]
      : []),
  ];

  const osmPolyline: OSMPolyline | undefined = routeCoordinates.length
    ? { coordinates: routeCoordinates, color: Colors.routeColor, weight: 4 }
    : undefined;

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {Platform.OS === 'android' ? (
        <OSMMap
          center={mapCenter}
          markers={osmMarkers}
          polyline={osmPolyline}
          fitBounds
          style={{ height: '55%' }}
        />
      ) : (
        <MapView
          ref={mapRef}
          className="h-[55%]"
          initialRegion={{
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
            latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
            longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
          }}
        >
          <Polyline coordinates={routeCoordinates} strokeColor={Colors.routeColor} strokeWidth={4} />
          {rideData?.pickup && (
            <Marker coordinate={{ latitude: rideData.pickup.latitude, longitude: rideData.pickup.longitude }}>
              <View className="w-10 h-10 bg-success rounded-full items-center justify-center">
                <Text className="text-white text-lg">📍</Text>
              </View>
            </Marker>
          )}
          {rideData?.drop && (
            <Marker coordinate={{ latitude: rideData.drop.latitude, longitude: rideData.drop.longitude }}>
              <View className="w-10 h-10 bg-danger rounded-full items-center justify-center">
                <Text className="text-white text-lg">🏁</Text>
              </View>
            </Marker>
          )}
        </MapView>
      )}

      <SafeAreaView className="absolute top-0 left-0 right-0">
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
          >
            <ArrowLeft size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <View className="flex-row">
            <TouchableOpacity className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg mr-2">
              <Phone size={20} color={Colors.success} />
            </TouchableOpacity>
            <TouchableOpacity className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg">
              <MessageCircle size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-2xl">
        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

        <View className="px-4">
          <Text className="text-lg font-semibold text-secondary">Driver Controls</Text>
          <Text className="text-sm text-gray-500">
            {rideData?.status === 'ACCEPTED' && 'Navigate to pickup location'}
            {rideData?.status === 'ARRIVED' && 'Verify passenger OTP'}
            {rideData?.status === 'START' && 'Trip in progress'}
            {rideData?.status === 'COMPLETED' && 'Trip completed'}
          </Text>
        </View>

        {rideData?.status === 'ACCEPTED' && (
          <View className="mt-4 px-4">
            <Button title="Mark Arrived" onPress={handleArrived} variant="primary" />
          </View>
        )}

        {rideData?.status === 'ARRIVED' && (
          <View className="mt-4 px-4">
            <Text className="text-sm text-gray-500 mb-2">Enter OTP from passenger</Text>
            <TextInput
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="numeric"
              placeholder="OTP"
              className="bg-gray-100 rounded-xl px-4 py-3 text-secondary"
            />
            <View className="mt-3">
              <Button title="Verify OTP & Start" onPress={handleVerifyOtp} variant="primary" />
            </View>
          </View>
        )}

        {rideData?.status === 'START' && (
          <View className="mt-4 px-4">
            <Button title="Complete Trip" onPress={handleComplete} variant="primary" />
          </View>
        )}
      </View>
    </View>
  );
};

export default DriverRideScreen;
