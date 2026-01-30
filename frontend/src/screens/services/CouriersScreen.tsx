import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Package, MapPin, Clock, ChevronRight, Box, FileText, Truck, Scale } from 'lucide-react-native';
import { Colors } from '../../config/colors';

const packageTypes = [
  { id: 'document', name: 'Documents', icon: FileText, description: 'Letters, papers, files' },
  { id: 'small', name: 'Small Package', icon: Box, description: 'Up to 5 kg' },
  { id: 'medium', name: 'Medium Package', icon: Package, description: '5-15 kg' },
  { id: 'large', name: 'Large Package', icon: Truck, description: '15-30 kg' },
];

export const CouriersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [packageDescription, setPackageDescription] = useState('');

  const handleBookCourier = () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a package type');
      return;
    }
    if (!pickupAddress || !dropAddress) {
      Alert.alert('Error', 'Please enter pickup and delivery addresses');
      return;
    }

    Alert.alert(
      'Courier Booked!',
      'Your courier request has been submitted. A driver will pick up your package soon.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
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
          <Text className="text-xl font-semibold text-secondary">Courier Service</Text>
          <Text className="text-sm text-gray-500">Send packages across the city</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Package Types */}
        <View className="px-4 py-4">
          <Text className="text-base font-semibold text-secondary mb-3">What are you sending?</Text>
          <View className="flex-row flex-wrap justify-between">
            {packageTypes.map((pkg) => {
              const Icon = pkg.icon;
              const isSelected = selectedPackage === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  onPress={() => setSelectedPackage(pkg.id)}
                  className={`w-[48%] p-4 rounded-xl mb-3 ${
                    isSelected ? 'bg-primary/10 border-2 border-primary' : 'bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <Icon size={24} color={isSelected ? Colors.primary : Colors.gray500} />
                  <Text className={`text-sm font-semibold mt-2 ${isSelected ? 'text-secondary' : 'text-gray-700'}`}>
                    {pkg.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">{pkg.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pickup & Drop */}
        <View className="px-4 py-4 bg-gray-50">
          <Text className="text-base font-semibold text-secondary mb-3">Pickup & Delivery</Text>
          
          <View className="bg-white rounded-xl p-4 mb-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                <MapPin size={16} color={Colors.success} />
              </View>
              <Text className="text-sm font-medium text-gray-500 ml-2">Pickup Location</Text>
            </View>
            <TextInput
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Enter pickup address"
              className="mt-2 text-base text-secondary"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          <View className="bg-white rounded-xl p-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                <MapPin size={16} color={Colors.danger} />
              </View>
              <Text className="text-sm font-medium text-gray-500 ml-2">Delivery Location</Text>
            </View>
            <TextInput
              value={dropAddress}
              onChangeText={setDropAddress}
              placeholder="Enter delivery address"
              className="mt-2 text-base text-secondary"
              placeholderTextColor={Colors.gray400}
            />
          </View>
        </View>

        {/* Package Details */}
        <View className="px-4 py-4">
          <Text className="text-base font-semibold text-secondary mb-3">Package Details (Optional)</Text>
          <TextInput
            value={packageDescription}
            onChangeText={setPackageDescription}
            placeholder="Describe your package..."
            multiline
            numberOfLines={3}
            className="bg-gray-50 rounded-xl p-4 text-base text-secondary"
            placeholderTextColor={Colors.gray400}
            textAlignVertical="top"
          />
        </View>

        {/* Estimated Fare */}
        <View className="mx-4 p-4 bg-primary/10 rounded-xl">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600">Estimated Fare</Text>
              <Text className="text-2xl font-bold text-secondary">NPR 100-150</Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={16} color={Colors.gray500} />
              <Text className="text-sm text-gray-500 ml-1">~30 min</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="px-4 pb-6 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleBookCourier}
          className="bg-primary py-4 rounded-2xl items-center"
        >
          <Text className="text-base font-semibold text-secondary">Book Courier</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CouriersScreen;
