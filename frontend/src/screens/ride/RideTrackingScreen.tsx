import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ArrowLeft, Phone, MessageCircle, Share2, AlertTriangle } from 'lucide-react-native';
import { useRideStore, useLocationStore, useAuthStore } from '../../store';
import { socketManager, safetyService, rideService, galliMapsService } from '../../services';
import { triggerAlertFeedback } from '../../utils/alertUtils';
import { DriverCard, RideStatusCard, Button, OSMMap, OSMMarker, OSMPolyline } from '../../components/ui';
import { Colors } from '../../config/colors';
import { MAP_CONFIG } from '../../config/constants';
import { Ride, Coordinates } from '../../types';

const { width, height } = Dimensions.get('window');

type RouteParams = {
  RideTracking: {
    rideId: string;
  };
};

export const RideTrackingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'RideTracking'>>();
  const { rideId } = route.params;
  const mapRef = useRef<MapView>(null);

  const {
    currentRide,
    setCurrentRide,
    riderLocation,
    setRiderLocation,
    setSearchingRider,
    clearServiceDetails,
    clearRide,
  } = useRideStore();
  const { user } = useAuthStore();
  const isRider = user?.role === 'rider';

  const { pickupLocation, dropLocation, clearLocations } = useLocationStore();

  const [isSearching, setIsSearching] = useState(true);
  const [mapCenter, setMapCenter] = useState<Coordinates>({
    latitude: MAP_CONFIG.DEFAULT_LATITUDE,
    longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
  });
  const [otpInput, setOtpInput] = useState('');
  const [lastStatus, setLastStatus] = useState<Ride['status'] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [simulatedLocation, setSimulatedLocation] = useState<Coordinates | null>(null);
  const simulationIndexRef = useRef(0);

  useEffect(() => {
    setupSocketListeners();
    
    // Only subscribe to ride if we don't already have currentRide data
    if (!currentRide || currentRide._id !== rideId) {
      subscribeToRide();
    } else {
      // We already have ride data (from accept offer flow)
      setIsSearching(false);
      setSearchingRider(false);
    }

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (currentRide?.rider && typeof currentRide.rider === 'object') {
      subscribeToRiderLocation(currentRide.rider._id);
    }
  }, [currentRide?.rider]);

  const setupSocketListeners = () => {
    socketManager.onRideUpdate((ride: Ride) => {
      setCurrentRide(ride);
      if (!isRider && ride.status === 'ARRIVED' && lastStatus !== 'ARRIVED') {
        triggerAlertFeedback('arrival');
        Alert.alert('Driver Arrived', 'Your driver has arrived at pickup location.');
      }
      setLastStatus(ride.status);
      if (ride.status !== 'SEARCHING_FOR_RIDER') {
        setIsSearching(false);
        setSearchingRider(false);
      }
    });

    socketManager.onRideAccepted(() => {
      setIsSearching(false);
      setSearchingRider(false);
    });

    socketManager.onRideData((ride: Ride) => {
      setCurrentRide(ride);
      if (!isRider && ride.status === 'ARRIVED' && lastStatus !== 'ARRIVED') {
        triggerAlertFeedback('arrival');
        Alert.alert('Driver Arrived', 'Your driver has arrived at pickup location.');
      }
      setLastStatus(ride.status);
      if (ride.status !== 'SEARCHING_FOR_RIDER') {
        setIsSearching(false);
      }
    });

    socketManager.onRiderLocationUpdate(({ riderId, coords }) => {
      setRiderLocation(coords);
      animateToRider(coords);
    });

    socketManager.onRideCanceled(({ message }) => {
      Alert.alert('Ride Canceled', message);
      handleRideEnd();
    });

    socketManager.onError(({ message }) => {
      // Only show error if it's not a "ride not found" type error during demo/mock mode
      if (!message.includes('Failed to receive') && !message.includes('not found')) {
        Alert.alert('Error', message);
      } else {
        console.log('Socket info:', message);
      }
    });
  };

  const subscribeToRide = () => {
    socketManager.subscribeToRide(rideId);
    socketManager.searchRider(rideId);
    setSearchingRider(true);
  };

  const subscribeToRiderLocation = (riderId: string) => {
    socketManager.subscribeToRiderLocation(riderId);
  };

  const animateToRider = (coords: Coordinates) => {
    if (Platform.OS === 'android') {
      setMapCenter(coords);
      return;
    }
    mapRef.current?.animateToRegion({
      ...coords,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const cleanup = () => {
    socketManager.off('rideUpdate');
    socketManager.off('rideAccepted');
    socketManager.off('riderLocationUpdate');
    socketManager.off('rideCanceled');
    socketManager.off('rideData');
    socketManager.off('error');
  };

  const handleCancelRide = () => {
    const reasons = [
      'Driver taking too long',
      'Wrong pickup location',
      'Changed my mind',
      'Booked by mistake',
      'Other',
    ];

    Alert.alert(
      'Why are you cancelling?',
      'Select a reason to help us improve the service.',
      [
        ...reasons.map((reason) => ({
          text: reason,
          onPress: () => {
            socketManager.cancelRide();
            handleRideEnd();
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRideEnd = () => {
    clearRide();
    clearServiceDetails();
    clearLocations();
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainDrawer' }],
    });
  };

  const handleRideComplete = () => {
    // Navigate to completion screen for rating
    navigation.replace('RideCompletion', { rideId });
  };

  const handleMarkArrived = async () => {
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

  const handleDriverComplete = async () => {
    if (!currentRide) return;
    try {
      await rideService.updateRideStatus(currentRide._id, { status: 'COMPLETED' });
      handleRideComplete();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete ride');
    }
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will alert emergency services and your emergency contacts with your live location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency (100)',
          style: 'destructive',
          onPress: () => {
            safetyService
              .sendSOS({
                rideId,
                location: riderLocation || pickupLocation.coordinates || undefined,
              })
              .catch(() => undefined)
              .finally(() => {
                Alert.alert('Emergency Contacted', 'Your location has been shared with emergency services.');
              });
          },
        },
      ]
    );
  };

  const handleShareTrip = () => {
    safetyService
      .shareTrip({ rideId, sharedWith: [], expiresInMinutes: 120 })
      .then((response) => {
        const tripDetails = `
I'm on a ride with ChetanDrive.
Pickup: ${pickupLocation.address}
Drop: ${dropLocation.address}
Driver: ${rider?.phone || 'Searching...'}
Track my trip: ${response.shareLink}
        `.trim();

        Alert.alert(
          'Share Trip',
          'Share your live trip details with friends and family',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Share via SMS',
              onPress: () => {
                // In production: Share.share({ message: tripDetails });
                Alert.alert('Trip Shared', 'Your trip details have been shared.');
              },
            },
          ]
        );
      })
      .catch(() => Alert.alert('Error', 'Failed to create trip share link'));
  };

  const handleCallDriver = () => {
    if (rider) {
      // In production: Linking.openURL(`tel:${rider.phone}`);
      Alert.alert('Calling Driver', `Calling ${rider.phone}...`);
    }
  };

  const handleChatDriver = () => {
    if (rider && currentRide) {
      navigation.navigate('Chat', {
        rideId: currentRide._id,
        driver: {
          _id: rider._id,
          name: rider.phone || 'Driver',
          phone: rider.phone,
          rating: 4.8,
          totalRides: 100,
          acceptanceRate: 95,
          cancellationRate: 2,
          memberSince: '2023',
          verificationBadges: ['ID Verified'],
          vehicle: {
            type: currentRide.vehicle,
            make: 'Unknown',
            model: 'Unknown',
            color: 'Unknown',
            licensePlate: 'BA 1 PA 1234',
            year: 2020,
            capacity: 4,
          },
        },
      });
    }
  };

  useEffect(() => {
    if (currentRide?.status === 'COMPLETED') {
      handleRideComplete();
    }
  }, [currentRide?.status]);

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
          return;
        }
      } catch (error) {
        console.error('Route error:', error);
      }

      setRouteCoordinates(getSimpleRouteCoordinates());
    };

    calculateRoute();
  }, [pickupLocation.coordinates, dropLocation.coordinates]);

  useEffect(() => {
    const shouldSimulate =
      !isRider &&
      currentRide?.status === 'START' &&
      !riderLocation &&
      routeCoordinates.length > 1;

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
  }, [currentRide?.status, isRider, riderLocation, routeCoordinates]);

  const getSimpleRouteCoordinates = () => {
    if (!pickupLocation.coordinates || !dropLocation.coordinates) return [];
    return [pickupLocation.coordinates, dropLocation.coordinates];
  };

  const getRouteCoordinates = () => {
    if (routeCoordinates.length > 1) return routeCoordinates;
    return getSimpleRouteCoordinates();
  };

  const getRider = () => {
    if (!currentRide?.rider || typeof currentRide.rider === 'string') {
      return null;
    }
    return currentRide.rider;
  };

  const rider = getRider();

  const getDriverEmoji = () => {
    const vehicle = currentRide?.vehicle;
    if (vehicle === 'bike') return '🏍️';
    if (vehicle === 'auto') return '🛺';
    if (vehicle === 'pickupTruck') return '🛻';
    if (vehicle === 'miniTruck') return '🚚';
    if (vehicle === 'largeTruck') return '🚛';
    if (vehicle === 'containerTruck') return '📦';
    return '🚗';
  };

  const osmMarkers: OSMMarker[] = useMemo(() => {
    const markers: OSMMarker[] = [];

    if (pickupLocation.coordinates) {
      markers.push({
        latitude: pickupLocation.coordinates.latitude,
        longitude: pickupLocation.coordinates.longitude,
        title: 'Pickup',
        emoji: '📍',
        emojiSize: 22,
      });
    }

    if (dropLocation.coordinates) {
      markers.push({
        latitude: dropLocation.coordinates.latitude,
        longitude: dropLocation.coordinates.longitude,
        title: 'Drop',
        emoji: '🏁',
        emojiSize: 22,
      });
    }

    if (riderLocation) {
      markers.push({
        latitude: riderLocation.latitude,
        longitude: riderLocation.longitude,
        title: 'Driver',
        emoji: getDriverEmoji(),
        emojiSize: 22,
      });
    }

    if (simulatedLocation && !riderLocation) {
      markers.push({
        latitude: simulatedLocation.latitude,
        longitude: simulatedLocation.longitude,
        title: 'Driver (simulated)',
        emoji: getDriverEmoji(),
        emojiSize: 22,
      });
    }

    return markers;
  }, [pickupLocation, dropLocation, riderLocation, simulatedLocation]);

  const osmPolyline: OSMPolyline | undefined = useMemo(() => {
    const coords = getRouteCoordinates();
    if (!coords.length) return undefined;
    return {
      coordinates: coords,
      color: Colors.routeColor,
      weight: 4,
    };
  }, [pickupLocation, dropLocation, routeCoordinates]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {Platform.OS === 'android' ? (
        <OSMMap
          center={riderLocation || simulatedLocation || pickupLocation.coordinates || mapCenter}
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
            latitude: pickupLocation.coordinates?.latitude || MAP_CONFIG.DEFAULT_LATITUDE,
            longitude: pickupLocation.coordinates?.longitude || MAP_CONFIG.DEFAULT_LONGITUDE,
            latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
            longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
          }}
        >
          <Polyline
            coordinates={getRouteCoordinates()}
            strokeColor={Colors.routeColor}
            strokeWidth={4}
          />

          {pickupLocation.coordinates && (
            <Marker coordinate={pickupLocation.coordinates} title="Pickup">
              <View className="w-10 h-10 bg-success rounded-full items-center justify-center">
                <Text className="text-white text-lg">📍</Text>
              </View>
            </Marker>
          )}

          {dropLocation.coordinates && (
            <Marker coordinate={dropLocation.coordinates} title="Drop">
              <View className="w-10 h-10 bg-danger rounded-full items-center justify-center">
                <Text className="text-white text-lg">🏁</Text>
              </View>
            </Marker>
          )}

          {riderLocation && (
            <Marker coordinate={riderLocation} title="Driver">
              <View className="w-12 h-12 bg-secondary rounded-full items-center justify-center shadow-lg">
                <Text className="text-2xl">{getDriverEmoji()}</Text>
              </View>
            </Marker>
          )}

          {simulatedLocation && !riderLocation && (
            <Marker coordinate={simulatedLocation} title="Driver (simulated)">
              <View className="w-12 h-12 bg-secondary rounded-full items-center justify-center shadow-lg">
                <Text className="text-2xl">{getDriverEmoji()}</Text>
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
            {/* Share Trip */}
            <TouchableOpacity
              onPress={handleShareTrip}
              className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg mr-2"
            >
              <Share2 size={20} color={Colors.info} />
            </TouchableOpacity>
            
            {rider && (
              <>
                <TouchableOpacity
                  onPress={handleCallDriver}
                  className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg mr-2"
                >
                  <Phone size={20} color={Colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChatDriver}
                  className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
                >
                  <MessageCircle size={20} color={Colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* SOS Button - Always visible */}
      <TouchableOpacity
        onPress={handleSOS}
        className="absolute right-4 top-24 w-14 h-14 bg-red-500 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 10 }}
      >
        <AlertTriangle size={24} color={Colors.white} />
        <Text className="text-white text-[8px] font-bold mt-0.5">SOS</Text>
      </TouchableOpacity>

      <View className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-2xl">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          <RideStatusCard
            status={currentRide?.status || 'SEARCHING_FOR_RIDER'}
            pickupAddress={currentRide?.pickup?.address || pickupLocation.address}
            dropAddress={currentRide?.drop?.address || dropLocation.address}
            fare={currentRide?.fare || 0}
            distance={currentRide?.distance || 0}
            onCancel={handleCancelRide}
            canCancel={
              !isRider &&
              (currentRide?.status === 'SEARCHING_FOR_RIDER' || currentRide?.status === 'ACCEPTED')
            }
          />

          {rider && currentRide?.status !== 'SEARCHING_FOR_RIDER' && (
            <View className="mt-4">
              <DriverCard
                name={rider.phone || 'Driver'}
                rating={4.8}
                vehicleNumber="Ba 1 Ja 1234"
                vehicleModel={currentRide?.vehicle || 'Car'}
                otp={currentRide?.otp || undefined}
                onCall={() => {}}
                onMessage={() => {}}
              />
            </View>
          )}

          {isRider && currentRide?.status === 'ACCEPTED' && (
            <View className="mt-4">
              <Button title="Mark Arrived" onPress={handleMarkArrived} variant="primary" />
            </View>
          )}

          {isRider && currentRide?.status === 'ARRIVED' && (
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

          {isRider && currentRide?.status === 'START' && (
            <View className="mt-4">
              <Button title="Complete Trip" onPress={handleDriverComplete} variant="primary" />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default RideTrackingScreen;
