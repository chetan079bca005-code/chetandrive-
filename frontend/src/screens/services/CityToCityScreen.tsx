import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin, Calendar, Clock, Users, ChevronRight, ChevronDown } from 'lucide-react-native';
import { Colors } from '../../config/colors';
import { useLocationStore, useRideStore } from '../../store';

const popularRoutes = [
  { from: 'Kathmandu', to: 'Pokhara', fare: 'NPR 800-1200', time: '6-7 hrs' },
  { from: 'Kathmandu', to: 'Chitwan', fare: 'NPR 600-900', time: '4-5 hrs' },
  { from: 'Kathmandu', to: 'Lumbini', fare: 'NPR 1000-1500', time: '8-9 hrs' },
  { from: 'Pokhara', to: 'Chitwan', fare: 'NPR 500-800', time: '4-5 hrs' },
];

const cityCoords: Record<string, { latitude: number; longitude: number }> = {
  Kathmandu: { latitude: 27.7172, longitude: 85.3240 },
  Pokhara: { latitude: 28.2096, longitude: 83.9856 },
  Chitwan: { latitude: 27.5291, longitude: 84.3542 },
  Lumbini: { latitude: 27.4844, longitude: 83.2760 },
  Patan: { latitude: 27.6644, longitude: 85.3188 },
  Bhaktapur: { latitude: 27.6710, longitude: 85.4298 },
};

export const CityToCityScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { setPickupLocation, setDropLocation } = useLocationStore();
  const { setServiceDetails } = useRideStore();
  const [fromCity, setFromCity] = useState('Kathmandu');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const handleSearch = () => {
    if (!toCity) {
      Alert.alert('Error', 'Please select a destination city');
      return;
    }

    const fromCoords = cityCoords[fromCity];
    const toCoords = cityCoords[toCity];

    if (!fromCoords || !toCoords) {
      Alert.alert('Error', 'Selected city coordinates are not available');
      return;
    }

    setPickupLocation(fromCoords, fromCity);
    setDropLocation(toCoords, toCity);

    setServiceDetails({
      intercity: {
        fromCity,
        toCity,
        date: date || 'Today',
        passengers,
      },
    });

    navigation.navigate('RideConfirmation', { serviceType: 'intercity' });
  };

  const handleSelectRoute = (from: string, to: string) => {
    setFromCity(from);
    setToCity(to);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <View className="ml-2">
          <Text className="text-xl font-semibold text-secondary">City to City</Text>
          <Text className="text-sm text-gray-500">Intercity rides and shared travel</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Route Selection */}
        <View className="px-4 py-4">
          <View className="bg-gray-50 rounded-2xl p-4">
            <View className="mb-4">
              <Text className="text-xs text-gray-500 mb-1">FROM</Text>
              <TouchableOpacity className="flex-row items-center justify-between py-2 border-b border-gray-200">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                    <MapPin size={16} color={Colors.success} />
                  </View>
                  <Text className="text-base font-semibold text-secondary ml-3">{fromCity}</Text>
                </View>
                <ChevronDown size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-xs text-gray-500 mb-1">TO</Text>
              <TouchableOpacity className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                    <MapPin size={16} color={Colors.danger} />
                  </View>
                  <TextInput
                    value={toCity}
                    onChangeText={setToCity}
                    placeholder="Select destination"
                    className="text-base font-semibold text-secondary ml-3"
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
                <ChevronDown size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date & Passengers */}
        <View className="flex-row px-4 mb-4">
          <TouchableOpacity className="flex-1 bg-gray-50 rounded-xl p-4 mr-2">
            <View className="flex-row items-center">
              <Calendar size={20} color={Colors.gray500} />
              <Text className="text-sm text-gray-500 ml-2">Date</Text>
            </View>
            <Text className="text-base font-semibold text-secondary mt-1">Today</Text>
          </TouchableOpacity>

          <View className="flex-1 bg-gray-50 rounded-xl p-4 ml-2">
            <View className="flex-row items-center">
              <Users size={20} color={Colors.gray500} />
              <Text className="text-sm text-gray-500 ml-2">Passengers</Text>
            </View>
            <View className="flex-row items-center justify-between mt-1">
              <TouchableOpacity
                onPress={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-8 h-8 bg-white rounded-full items-center justify-center"
              >
                <Text className="text-lg text-secondary">-</Text>
              </TouchableOpacity>
              <Text className="text-base font-semibold text-secondary">{passengers}</Text>
              <TouchableOpacity
                onPress={() => setPassengers(Math.min(6, passengers + 1))}
                className="w-8 h-8 bg-white rounded-full items-center justify-center"
              >
                <Text className="text-lg text-secondary">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Popular Routes */}
        <View className="px-4 py-4">
          <Text className="text-base font-semibold text-secondary mb-3">Popular Routes</Text>
          
          {popularRoutes.map((route, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelectRoute(route.from, route.to)}
              className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-2"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-secondary">
                  {route.from} → {route.to}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Clock size={12} color={Colors.gray500} />
                  <Text className="text-xs text-gray-500 ml-1">{route.time}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold text-primary">{route.fare}</Text>
                <Text className="text-xs text-gray-500">per seat</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Banner */}
        <View className="mx-4 p-4 bg-blue-50 rounded-xl mb-4">
          <Text className="text-sm font-semibold text-blue-800">💡 How it works</Text>
          <Text className="text-xs text-blue-600 mt-1">
            Book a seat in shared rides or book the entire vehicle. Save money by sharing your ride with other travelers going the same way.
          </Text>
        </View>
      </ScrollView>

      <View className="px-4 pb-6 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSearch}
          className="bg-primary py-4 rounded-2xl items-center"
        >
          <Text className="text-base font-semibold text-secondary">Search Rides</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CityToCityScreen;
