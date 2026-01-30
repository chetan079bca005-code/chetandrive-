import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
  X,
  Clock,
  Search,
  TrendingUp,
  MapPin,
  Navigation,
  AlertCircle,
} from 'lucide-react-native';
import { useLocationStore, useRideStore, useOfferStore } from '../../store';
import { socketManager, rideService } from '../../services';
import { DriverOfferCard, OSMMap, OSMMarker, OSMPolyline } from '../../components/ui';
import { Colors } from '../../config/colors';
import { MAP_CONFIG } from '../../config/constants';
import { DriverOffer, DriverProfile, VehicleDetails } from '../../types';

type RouteParams = {
  DriverOffers: {
    proposedFare: number;
    distance: number;
    duration: number;
    routeCoordinates?: { latitude: number; longitude: number }[];
  };
};

export const DriverOffersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'DriverOffers'>>();
  const { proposedFare, distance, duration, routeCoordinates = [] } = route.params;

  const { pickupLocation, dropLocation } = useLocationStore();
  const { setCurrentRide } = useRideStore();
  const {
    driverOffers,
    addOffer,
    setSelectedOffer,
    acceptOffer,
    counterOffer,
    clearOffers,
    isSearching,
    setSearching,
    searchTimer,
    setSearchTimer,
  } = useOfferStore();

  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'eta'>('price');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate driver offers for demo (in production, these come from socket)
  useEffect(() => {
    setSearching(true);
    setSearchTimer(300); // 5 minutes

    // Pulse animation for searching state
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Timer countdown
    timerRef.current = setInterval(() => {
      const currentTimer = useOfferStore.getState().searchTimer;
      if (currentTimer <= 1) {
        clearInterval(timerRef.current!);
        setSearching(false);
        setSearchTimer(0);
      } else {
        setSearchTimer(currentTimer - 1);
      }
    }, 1000);

    // Simulate incoming driver offers
    const offerTimeouts = [3000, 6000, 10000, 15000].map((delay, index) => {
      return setTimeout(() => {
        const mockOffer = generateMockOffer(index, proposedFare);
        addOffer(mockOffer);
      }, delay);
    });

    // Subscribe to real socket offers
    const unsubscribeOffer = socketManager.onRideOffer((ride) => {
      // Convert ride to DriverOffer format
      // This would be updated based on actual backend response
    });

    return () => {
      pulse.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      offerTimeouts.forEach(clearTimeout);
      unsubscribeOffer();
      clearOffers();
    };
  }, []);

  const generateMockOffer = (index: number, basePrice: number): DriverOffer => {
    const priceVariations = [-30, 0, 20, -10];
    const offeredFare = basePrice + priceVariations[index % 4];
    
    const mockDrivers: DriverProfile[] = [
      {
        _id: `driver_${index}`,
        name: ['Ram Sharma', 'Sita Thapa', 'Bikash KC', 'Anita Gurung'][index % 4],
        phone: '+977-98XXXXXXXX',
        photo: undefined,
        rating: [4.8, 4.9, 4.6, 4.7][index % 4],
        totalRides: [1245, 2340, 567, 890][index % 4],
        acceptanceRate: [95, 92, 88, 91][index % 4],
        cancellationRate: [2, 3, 5, 4][index % 4],
        memberSince: '2022',
        verificationBadges: ['ID Verified', 'Background Check'],
        vehicle: {
          type: ['bike', 'cabEconomy', 'cabPremium', 'auto'][index % 4] as any,
          make: ['Honda', 'Toyota', 'Maruti', 'Bajaj'][index % 4],
          model: ['Activa', 'Corolla', 'Swift', 'Pulsar'][index % 4],
          color: ['Black', 'White', 'Silver', 'Blue'][index % 4],
          licensePlate: `BA ${index + 1} PA ${1234 + index}`,
          year: 2020 + (index % 3),
          capacity: [1, 4, 4, 3][index % 4],
        },
      },
    ];

    return {
      _id: `offer_${Date.now()}_${index}`,
      rideRequestId: 'ride_123',
      driver: mockDrivers[0],
      offeredFare,
      originalFare: basePrice,
      priceComparison: offeredFare < basePrice ? 'below' : offeredFare === basePrice ? 'equal' : 'above',
      eta: [3, 5, 8, 4][index % 4],
      distance: [1.2, 2.5, 3.1, 1.8][index % 4],
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      const offer = driverOffers.find(o => o._id === offerId);
      if (!offer) return;

      Alert.alert(
        'Accept Offer',
        `Accept ${offer.driver.name}'s offer of NPR${Math.round(offer.offeredFare)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: async () => {
              try {
                acceptOffer(offerId);
                
                // Create mock ride data for the tracking screen
                const mockRide = {
                  _id: `ride_${Date.now()}`,
                  customer: 'current_user',
                  rider: {
                    _id: offer.driver._id,
                    phone: offer.driver.phone,
                  },
                  vehicle: offer.driver.vehicle?.type || 'cabEconomy',
                  pickup: {
                    address: pickupLocation.address,
                    latitude: pickupLocation.coordinates?.latitude || 0,
                    longitude: pickupLocation.coordinates?.longitude || 0,
                  },
                  drop: {
                    address: dropLocation.address,
                    latitude: dropLocation.coordinates?.latitude || 0,
                    longitude: dropLocation.coordinates?.longitude || 0,
                  },
                  fare: offer.offeredFare,
                  distance: distance,
                  status: 'START' as const,
                  otp: Math.floor(1000 + Math.random() * 9000).toString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                
                // Set the current ride in store
                setCurrentRide(mockRide as any);
                
                // Navigate to tracking
                setTimeout(() => {
                  navigation.replace('RideTracking', { rideId: mockRide._id });
                }, 300);
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to accept offer');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept offer');
    }
  };

  const handleCounterOffer = (offerId: string) => {
    const offer = driverOffers.find(o => o._id === offerId);
    if (offer) {
      setSelectedOfferId(offerId);
      setCounterAmount(Math.round(offer.offeredFare).toString());
      setCounterModalVisible(true);
    }
  };

  const submitCounterOffer = () => {
    if (!selectedOfferId || !counterAmount) return;
    
    const amount = parseInt(counterAmount, 10);
    if (isNaN(amount) || amount < 50) {
      Alert.alert('Invalid Amount', 'Please enter a valid fare amount');
      return;
    }

    counterOffer(selectedOfferId, amount, counterMessage || undefined);
    setCounterModalVisible(false);
    setCounterAmount('');
    setCounterMessage('');
    setSelectedOfferId(null);
  };

  const handleChat = (offerId: string) => {
    const offer = driverOffers.find(o => o._id === offerId);
    if (offer) {
      navigation.navigate('Chat', { offerId, driver: offer.driver });
    }
  };

  const handleViewProfile = (offerId: string) => {
    const offer = driverOffers.find(o => o._id === offerId);
    if (offer) {
      setSelectedOffer(offer);
      navigation.navigate('DriverProfile', { offer });
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Search',
      'Are you sure you want to cancel looking for drivers?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            socketManager.cancelRide();
            clearOffers();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleIncreaseFare = () => {
    navigation.navigate('RideConfirmation');
  };

  const sortedOffers = [...driverOffers].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.offeredFare - b.offeredFare;
      case 'rating':
        return b.driver.rating - a.driver.rating;
      case 'eta':
        return a.eta - b.eta;
      default:
        return 0;
    }
  });

  const osmMarkers: OSMMarker[] = [
    ...(pickupLocation.coordinates ? [{
      latitude: pickupLocation.coordinates.latitude,
      longitude: pickupLocation.coordinates.longitude,
      title: 'Pickup',
      emoji: '📍',
      emojiSize: 22,
    }] : []),
    ...(dropLocation.coordinates ? [{
      latitude: dropLocation.coordinates.latitude,
      longitude: dropLocation.coordinates.longitude,
      title: 'Drop',
      emoji: '🏁',
      emojiSize: 22,
    }] : []),
  ];

  const osmPolyline: OSMPolyline | undefined = routeCoordinates.length > 0 ? {
    coordinates: routeCoordinates,
    color: Colors.routeColor,
    weight: 4,
  } : undefined;

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map Section */}
      {Platform.OS === 'android' ? (
        <OSMMap
          center={pickupLocation.coordinates || {
            latitude: MAP_CONFIG.DEFAULT_LATITUDE,
            longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
          }}
          markers={osmMarkers}
          polyline={osmPolyline}
          fitBounds
          style={{ height: '30%' }}
        />
      ) : (
        <MapView
          className="h-[30%]"
          initialRegion={{
            latitude: pickupLocation.coordinates?.latitude || MAP_CONFIG.DEFAULT_LATITUDE,
            longitude: pickupLocation.coordinates?.longitude || MAP_CONFIG.DEFAULT_LONGITUDE,
            latitudeDelta: MAP_CONFIG.LATITUDE_DELTA * 2,
            longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA * 2,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={Colors.routeColor}
              strokeWidth={4}
            />
          )}
          {pickupLocation.coordinates && (
            <Marker coordinate={pickupLocation.coordinates}>
              <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
                <Navigation size={16} color={Colors.white} />
              </View>
            </Marker>
          )}
          {dropLocation.coordinates && (
            <Marker coordinate={dropLocation.coordinates}>
              <View className="w-8 h-8 bg-red-500 rounded-full items-center justify-center">
                <MapPin size={16} color={Colors.white} />
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Header */}
      <SafeAreaView className="absolute top-0 left-0 right-0">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            onPress={handleCancel}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
          >
            <X size={24} color={Colors.secondary} />
          </TouchableOpacity>
          
          <View className="bg-white px-4 py-2 rounded-full shadow-lg flex-row items-center">
            <Clock size={16} color={Colors.gray500} />
            <Text className="text-sm font-medium text-secondary ml-2">
              {formatTime(searchTimer)}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Offers Section */}
      <View className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-2xl">
        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3 mb-2" />

        {/* Status Header */}
        <View className="px-4 pb-3 border-b border-gray-100">
          {driverOffers.length === 0 ? (
            <View className="flex-row items-center">
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Search size={20} color={Colors.primary} />
              </Animated.View>
              <Text className="text-lg font-semibold text-secondary ml-2">
                Searching for drivers...
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-secondary">
                {driverOffers.length} Driver{driverOffers.length !== 1 ? 's' : ''} Responded
              </Text>
              
              {/* Sort Options */}
              <View className="flex-row">
                {(['price', 'rating', 'eta'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setSortBy(option)}
                    className={`px-3 py-1 rounded-full mx-1 ${sortBy === option ? 'bg-primary' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-xs font-medium ${sortBy === option ? 'text-secondary' : 'text-gray-600'}`}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          <Text className="text-sm text-gray-500 mt-1">
            Your offer: NPR{Math.round(proposedFare)} • {distance}km • {duration}min
          </Text>
        </View>

        {/* Offers List */}
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {sortedOffers.map((offer) => (
            <DriverOfferCard
              key={offer._id}
              offer={offer}
              passengerOffer={proposedFare}
              onAccept={handleAcceptOffer}
              onCounter={handleCounterOffer}
              onChat={handleChat}
              onViewProfile={handleViewProfile}
            />
          ))}

          {/* Empty State */}
          {driverOffers.length === 0 && (
            <View className="items-center py-10">
              <Animated.View
                className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4"
                style={{ transform: [{ scale: pulseAnim }] }}
              >
                <Search size={32} color={Colors.primary} />
              </Animated.View>
              <Text className="text-lg font-semibold text-secondary mb-1">
                Looking for drivers nearby
              </Text>
              <Text className="text-sm text-gray-500 text-center px-8">
                Please wait while we find available drivers for your ride
              </Text>
            </View>
          )}

          {/* No Suitable Offers Hint */}
          {driverOffers.length > 0 && driverOffers.length < 3 && (
            <View className="bg-yellow-50 rounded-2xl p-4 mb-4 flex-row items-center">
              <AlertCircle size={20} color={Colors.warning} />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-secondary">
                  Want more options?
                </Text>
                <Text className="text-xs text-gray-500">
                  Increasing your fare can attract more drivers
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleIncreaseFare}
                className="bg-primary px-3 py-2 rounded-lg"
              >
                <TrendingUp size={16} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
          )}

          <View className="h-20" />
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-4 pb-6 pt-4 border-t border-gray-100 bg-white">
          <TouchableOpacity
            onPress={handleCancel}
            className="py-3"
          >
            <Text className="text-center text-danger font-medium">Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Counter Offer Modal */}
      <Modal
        visible={counterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-semibold text-secondary mb-4">
              Make a Counter Offer
            </Text>
            
            <Text className="text-sm text-gray-500 mb-2">Your fare (NPR)</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-lg font-semibold text-secondary mb-4"
              value={counterAmount}
              onChangeText={setCounterAmount}
              keyboardType="number-pad"
              placeholder="Enter your fare"
            />
            
            <Text className="text-sm text-gray-500 mb-2">Message (optional)</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-secondary mb-6"
              value={counterMessage}
              onChangeText={setCounterMessage}
              placeholder="Add a message for the driver"
              multiline
            />
            
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setCounterModalVisible(false)}
                className="flex-1 py-4 bg-gray-100 rounded-xl mr-2"
              >
                <Text className="text-center font-semibold text-secondary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitCounterOffer}
                className="flex-1 py-4 bg-primary rounded-xl ml-2"
              >
                <Text className="text-center font-semibold text-secondary">Send Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverOffersScreen;
