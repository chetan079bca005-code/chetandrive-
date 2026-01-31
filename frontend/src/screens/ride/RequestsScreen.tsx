import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin, Clock } from 'lucide-react-native';
import * as Location from 'expo-location';
import { socketManager, rideService } from '../../services';
import { triggerAlertFeedback } from '../../utils/alertUtils';
import { useAuthStore, useLocationStore, useRideStore } from '../../store';
import { Colors } from '../../config/colors';
import { Ride } from '../../types';

export const RequestsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, isAuthenticated, tokens } = useAuthStore();
  const { currentLocation, setCurrentLocation } = useLocationStore();
  const { setCurrentRide } = useRideStore();

  const [onDuty, setOnDuty] = useState(false);
  const [rideRequests, setRideRequests] = useState<Ride[]>([]);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (user?.role !== 'rider') {
      Alert.alert('Access denied', 'Only drivers can view ride requests.');
      navigation.goBack();
      return;
    }

    const initSocket = async () => {
      try {
        if (!isAuthenticated || (!tokens?.access_token && !tokens?.refresh_token)) {
          return;
        }
        if (!socketManager.isConnected()) {
          await socketManager.connect();
        }
      } catch (error) {
        console.log('Socket init failed');
      }
    };

    initSocket();

    const unsubscribeRideOffer = socketManager.onRideOffer((ride) => {
      setRideRequests((prev) => {
        if (prev.find((r) => r._id === ride._id)) return prev;
        return [ride, ...prev];
      });
      triggerAlertFeedback('offer');
      Alert.alert('New Ride Request', `${ride.pickup.address} → ${ride.drop.address}`);
    });

    return () => {
      unsubscribeRideOffer();
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
    };
  }, [user, isAuthenticated, tokens?.access_token, tokens?.refresh_token]);

  const handleToggleDuty = async (value: boolean) => {
    if (!currentLocation) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Enable location services to go online.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setCurrentLocation(coords);
    }

    setOnDuty(value);
    if (value && currentLocation) {
      socketManager.goOnDuty(currentLocation);
      locationWatchRef.current?.remove();
      locationWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
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
      setRideRequests((prev) => prev.filter((r) => r._id !== rideId));
      navigation.navigate('DriverRide', { rideId: response.ride._id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept ride');
    }
  };

  const handleOpenOffer = (ride: Ride) => {
    setSelectedRide(ride);
    setOfferAmount(Math.round(ride.fare || ride.proposedFare || 0).toString());
    setOfferModalVisible(true);
  };

  const handleSendOffer = () => {
    if (!selectedRide) return;
    const amount = parseInt(offerAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid offer amount');
      return;
    }

    socketManager.makeOffer({
      rideId: selectedRide._id,
      offeredFare: amount,
      eta: 5,
      distanceToPickup: 1.5,
    });

    Alert.alert('Offer Sent', 'Your offer has been sent to the passenger.');
    setOfferModalVisible(false);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center"
          >
            <ArrowLeft size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <View className="ml-2">
            <Text className="text-xl font-semibold text-secondary">Ride Requests</Text>
            <Text className="text-sm text-gray-500">Live requests & offers</Text>
          </View>
          <View className="flex-1" />
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 mr-2">Online</Text>
            <Switch
              value={onDuty}
              onValueChange={handleToggleDuty}
              trackColor={{ false: Colors.gray300, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {rideRequests.length === 0 ? (
            <View className="items-center mt-10">
              <Text className="text-gray-500">No requests yet.</Text>
            </View>
          ) : (
            rideRequests.map((ride) => (
              <View key={ride._id} className="bg-gray-50 rounded-2xl p-4 mb-3">
                <Text className="text-sm text-secondary" numberOfLines={1}>
                  {ride.pickup.address} → {ride.drop.address}
                </Text>
                <View className="flex-row items-center mt-2">
                  <MapPin size={14} color={Colors.gray500} />
                  <Text className="text-xs text-gray-500 ml-1">{ride.serviceType || 'city'} ride</Text>
                  <View className="mx-2 w-1 h-1 bg-gray-300 rounded-full" />
                  <Clock size={14} color={Colors.gray500} />
                  <Text className="text-xs text-gray-500 ml-1">Offer: NPR {Math.round(ride.fare)}</Text>
                </View>
                <View className="flex-row justify-end mt-3">
                  <TouchableOpacity
                    className="bg-white px-3 py-2 rounded-lg mr-2"
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
            ))
          )}
        </ScrollView>
      </SafeAreaView>

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

export default RequestsScreen;
