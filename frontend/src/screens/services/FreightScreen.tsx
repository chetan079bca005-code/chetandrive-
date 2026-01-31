import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Truck, MapPin, Package, Scale, Clock, Phone, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../config/colors';
import { useLocationStore, useRideStore } from '../../store';

const vehicleTypes = [
  { id: 'pickup', name: 'Pickup Truck', capacity: '500 kg', icon: '🛻', price: 'NPR 1500+' },
  { id: 'mini', name: 'Mini Truck', capacity: '1 ton', icon: '🚛', price: 'NPR 2500+' },
  { id: 'large', name: 'Large Truck', capacity: '3 ton', icon: '🚚', price: 'NPR 5000+' },
  { id: 'container', name: 'Container', capacity: '5+ ton', icon: '📦', price: 'NPR 10000+' },
];

export const FreightScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { pickupLocation, dropLocation } = useLocationStore();
  const { setSelectedVehicle, setServiceDetails } = useRideStore();
  const [selectedVehicle, setSelectedVehicleOption] = useState<string | null>(null);
  const [goodsDescription, setGoodsDescription] = useState('');
  const [weight, setWeight] = useState('');

  const handleRequestQuote = () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle type');
      return;
    }
    if (!pickupLocation.coordinates || !dropLocation.coordinates) {
      Alert.alert('Error', 'Please select pickup and delivery locations');
      return;
    }

    setServiceDetails({
      freight: {
        vehicleCategory: selectedVehicle || '',
        goodsDescription: goodsDescription || '',
        weight: weight || '',
        services: [],
      },
    });

    navigation.navigate('RideConfirmation', { serviceType: 'freight' });
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleOption(vehicleId);
    if (vehicleId === 'pickup') setSelectedVehicle('pickupTruck');
    if (vehicleId === 'mini') setSelectedVehicle('miniTruck');
    if (vehicleId === 'large') setSelectedVehicle('largeTruck');
    if (vehicleId === 'container') setSelectedVehicle('containerTruck');
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
          <Text className="text-xl font-semibold text-secondary">Freight</Text>
          <Text className="text-sm text-gray-500">Move heavy goods with ease</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Vehicle Selection */}
        <View className="px-4 py-4">
          <Text className="text-base font-semibold text-secondary mb-3">Select Vehicle Type</Text>
          
          {vehicleTypes.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              onPress={() => handleSelectVehicle(vehicle.id)}
              className={`flex-row items-center p-4 rounded-xl mb-2 ${
                selectedVehicle === vehicle.id 
                  ? 'bg-primary/10 border-2 border-primary' 
                  : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              <Text className="text-3xl mr-3">{vehicle.icon}</Text>
              <View className="flex-1">
                <Text className={`text-base font-semibold ${
                  selectedVehicle === vehicle.id ? 'text-secondary' : 'text-gray-700'
                }`}>
                  {vehicle.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Scale size={12} color={Colors.gray500} />
                  <Text className="text-xs text-gray-500 ml-1">{vehicle.capacity}</Text>
                </View>
              </View>
              <Text className="text-sm font-semibold text-primary">{vehicle.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pickup & Drop */}
        <View className="px-4 py-4 bg-gray-50">
          <Text className="text-base font-semibold text-secondary mb-3">Locations</Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('LocationSearch', { type: 'pickup', serviceType: 'freight' })}
            className="bg-white rounded-xl p-4 mb-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                <MapPin size={16} color={Colors.success} />
              </View>
              <Text className="text-sm font-medium text-gray-500 ml-2">Pickup Location</Text>
            </View>
            <Text className="text-base text-secondary">
              {pickupLocation.address || 'Select pickup location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('LocationSearch', { type: 'drop', serviceType: 'freight' })}
            className="bg-white rounded-xl p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                <MapPin size={16} color={Colors.danger} />
              </View>
              <Text className="text-sm font-medium text-gray-500 ml-2">Delivery Location</Text>
            </View>
            <Text className="text-base text-secondary">
              {dropLocation.address || 'Select delivery location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Goods Details */}
        <View className="px-4 py-4">
          <Text className="text-base font-semibold text-secondary mb-3">Goods Details</Text>
          
          <View className="bg-gray-50 rounded-xl p-4 mb-3">
            <Text className="text-sm text-gray-500 mb-2">Description</Text>
            <TextInput
              value={goodsDescription}
              onChangeText={setGoodsDescription}
              placeholder="What are you transporting?"
              multiline
              numberOfLines={2}
              className="text-base text-secondary"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-sm text-gray-500 mb-2">Approximate Weight (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g., 500"
              keyboardType="numeric"
              className="text-base text-secondary"
              placeholderTextColor={Colors.gray400}
            />
          </View>
        </View>

        {/* Contact Info */}
        <View className="mx-4 p-4 bg-blue-50 rounded-xl mb-4">
          <View className="flex-row items-center">
            <Phone size={20} color={Colors.info} />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-blue-800">Need help?</Text>
              <Text className="text-xs text-blue-600">Call our freight team at +977-1-4XXXXXX</Text>
            </View>
          </View>
        </View>

        {/* Services */}
        <View className="px-4 pb-4">
          <Text className="text-base font-semibold text-secondary mb-3">Additional Services</Text>
          
          <View className="flex-row">
            <TouchableOpacity className="flex-1 bg-gray-50 rounded-xl p-3 mr-2 items-center">
              <Package size={20} color={Colors.gray500} />
              <Text className="text-xs text-gray-600 mt-1">Loading</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-50 rounded-xl p-3 mx-1 items-center">
              <Package size={20} color={Colors.gray500} />
              <Text className="text-xs text-gray-600 mt-1">Unloading</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-50 rounded-xl p-3 ml-2 items-center">
              <Clock size={20} color={Colors.gray500} />
              <Text className="text-xs text-gray-600 mt-1">Express</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View className="px-4 pb-6 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleRequestQuote}
          className="bg-primary py-4 rounded-2xl items-center"
        >
          <Text className="text-base font-semibold text-secondary">Request Quote</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FreightScreen;
