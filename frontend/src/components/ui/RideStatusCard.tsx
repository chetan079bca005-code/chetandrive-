import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Clock, Navigation } from 'lucide-react-native';
import { Colors } from '../../config/colors';

interface RideStatusCardProps {
  status: 'SEARCHING_FOR_RIDER' | 'ACCEPTED' | 'ARRIVED' | 'START' | 'COMPLETED';
  pickupAddress: string;
  dropAddress: string;
  fare: number;
  distance: number;
  onCancel?: () => void;
  canCancel?: boolean;
}

const statusConfig = {
  SEARCHING_FOR_RIDER: {
    title: 'Finding your ride',
    subtitle: 'Looking for nearby drivers...',
    color: Colors.primary,
    showLoader: true,
  },
  ACCEPTED: {
    title: 'Driver is on the way',
    subtitle: 'Your driver is heading to pickup location',
    color: Colors.info,
    showLoader: false,
  },
  ARRIVED: {
    title: 'Driver has arrived',
    subtitle: 'Your driver is waiting at pickup location',
    color: Colors.success,
    showLoader: false,
  },
  START: {
    title: 'Trip in progress',
    subtitle: 'Enjoy your ride',
    color: Colors.info,
    showLoader: false,
  },
  COMPLETED: {
    title: 'Ride completed',
    subtitle: 'Thank you for riding with us!',
    color: Colors.success,
    showLoader: false,
  },
};

export const RideStatusCard: React.FC<RideStatusCardProps> = ({
  status,
  pickupAddress,
  dropAddress,
  fare,
  distance,
  onCancel,
  canCancel = true,
}) => {
  const config = statusConfig[status];

  return (
    <View className="bg-white rounded-2xl p-4 shadow-lg">
      {/* Status Header */}
      <View className="flex-row items-center mb-4">
        {config.showLoader ? (
          <ActivityIndicator size="small" color={config.color} />
        ) : (
          <View
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: config.color }}
          />
        )}
        <View className="flex-1 ml-2">
          <Text className="text-lg font-semibold text-secondary">
            {config.title}
          </Text>
          <Text className="text-sm text-gray-500">{config.subtitle}</Text>
        </View>
      </View>

      {/* Route Info */}
      <View className="bg-gray-50 rounded-xl p-3 mb-4">
        {/* Pickup */}
        <View className="flex-row items-center mb-3">
          <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center mr-3">
            <Navigation size={16} color={Colors.success} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500">PICKUP</Text>
            <Text className="text-sm text-secondary" numberOfLines={1}>
              {pickupAddress}
            </Text>
          </View>
        </View>

        {/* Vertical Line */}
        <View className="ml-4 w-0.5 h-4 bg-gray-300 mb-3" />

        {/* Drop */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-danger/10 items-center justify-center mr-3">
            <MapPin size={16} color={Colors.danger} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500">DROP</Text>
            <Text className="text-sm text-secondary" numberOfLines={1}>
              {dropAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Fare and Distance */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Clock size={16} color={Colors.gray500} />
          <Text className="text-sm text-gray-500 ml-1">{distance} km</Text>
        </View>
        <Text className="text-xl font-bold text-secondary">रु {Math.round(fare)}</Text>
      </View>

      {/* Cancel Button */}
      {canCancel && onCancel && status !== 'COMPLETED' && (
        <TouchableOpacity
          onPress={onCancel}
          className="py-3 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-danger font-medium">Cancel Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default RideStatusCard;
