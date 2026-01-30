import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { Colors } from '../../config/colors';

interface LocationInputProps {
  pickupAddress: string;
  dropAddress: string;
  onPickupPress: () => void;
  onDropPress: () => void;
  onSwap?: () => void;
  showSwap?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  pickupAddress,
  dropAddress,
  onPickupPress,
  onDropPress,
  onSwap,
  showSwap = true,
}) => {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-lg">
      {/* Pickup Location */}
      <TouchableOpacity
        onPress={onPickupPress}
        className="flex-row items-center py-3"
        activeOpacity={0.7}
      >
        <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center mr-3">
          <Navigation size={20} color={Colors.success} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">PICKUP</Text>
          <Text
            className={`text-base ${pickupAddress ? 'text-secondary font-medium' : 'text-gray-400'}`}
            numberOfLines={1}
          >
            {pickupAddress || 'Enter pickup location'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Divider with Line */}
      <View className="flex-row items-center ml-5">
        <View className="w-0.5 h-8 bg-gray-200 ml-4" />
        <View className="flex-1 h-px bg-gray-100 ml-6" />
      </View>

      {/* Drop Location */}
      <TouchableOpacity
        onPress={onDropPress}
        className="flex-row items-center py-3"
        activeOpacity={0.7}
      >
        <View className="w-10 h-10 rounded-full bg-danger/10 items-center justify-center mr-3">
          <MapPin size={20} color={Colors.danger} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">DROP</Text>
          <Text
            className={`text-base ${dropAddress ? 'text-secondary font-medium' : 'text-gray-400'}`}
            numberOfLines={1}
          >
            {dropAddress || 'Where to?'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Swap Button */}
      {showSwap && onSwap && (
        <TouchableOpacity
          onPress={onSwap}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Text className="text-lg">⇅</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default LocationInput;
