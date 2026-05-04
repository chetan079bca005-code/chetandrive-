import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin, Clock, CircleDollarSign } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Ride } from '../../types';
import { Colors } from '../../config/colors';

const vehicleEmojis = {
  bike: '🏍️',
  auto: '🛺',
  cabEconomy: '🚗',
  cabPremium: '🚙',
  pickupTruck: '🛻',
  miniTruck: '🚚',
  largeTruck: '🚛',
  containerTruck: '🚛',
};

export const RideDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { ride } = route.params as { ride: Ride };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NP', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View className="flex-row items-center px-4 py-3 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-gray-800">Ride Details</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Route Info */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-start mb-4">
            <View className="items-center mt-1 mr-3">
              <View className="w-3 h-3 rounded-full bg-blue-500" />
              <View className="w-0.5 h-10 bg-gray-300 my-1" />
              <MapPin size={16} color={Colors.primary} />
            </View>
            <View className="flex-1">
              <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">Pickup</Text>
                <Text className="text-base text-gray-800 font-medium" numberOfLines={2}>
                  {ride.pickup?.address || 'Current Location'}
                </Text>
              </View>
              <View>
                <Text className="text-sm text-gray-500 mb-1">Dropoff</Text>
                <Text className="text-base text-gray-800 font-medium" numberOfLines={2}>
                  {ride.drop?.address || 'Destination'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fare & Status */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm flex-row justify-between items-center">
          <View className="flex-row items-center">
            <CircleDollarSign size={24} color={Colors.primary} className="mr-2" />
            <Text className="text-xl font-bold text-gray-800">Rs. {ride.fare}</Text>
          </View>
          <View className="bg-gray-100 px-3 py-1 rounded-full">
            <Text className="text-sm font-medium text-gray-700 capitalize">
              {ride.status.replace(/_/g, ' ').toLowerCase()}
            </Text>
          </View>
        </View>

        {/* Ride Details */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Ride Info</Text>
          
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-gray-500">Date & Time</Text>
            <Text className="font-medium text-gray-800">
              {formatDate(ride.createdAt || new Date().toISOString())}
            </Text>
          </View>
          
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-gray-500">Distance</Text>
            <Text className="font-medium text-gray-800">
              {(ride.distance / 1000).toFixed(2)} km
            </Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Vehicle</Text>
            <Text className="font-medium text-gray-800 capitalize">
              {vehicleEmojis[ride.vehicle as keyof typeof vehicleEmojis] || '🚗'} {ride.vehicle}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
