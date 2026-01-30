import React from 'react';
import { View, Text, Image } from 'react-native';
import { Star, Phone, MessageCircle } from 'lucide-react-native';
import { Colors } from '../../config/colors';
import { Button } from './Button';

interface DriverCardProps {
  name: string;
  rating: number;
  vehicleNumber: string;
  vehicleModel: string;
  otp?: string;
  onCall?: () => void;
  onMessage?: () => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  name,
  rating,
  vehicleNumber,
  vehicleModel,
  otp,
  onCall,
  onMessage,
}) => {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-lg">
      {/* OTP Display */}
      {otp && (
        <View className="bg-primary/10 rounded-xl p-3 mb-4">
          <Text className="text-center text-sm text-gray-600 mb-1">
            Share this OTP with driver
          </Text>
          <Text className="text-center text-3xl font-bold text-secondary tracking-widest">
            {otp}
          </Text>
        </View>
      )}

      {/* Driver Info */}
      <View className="flex-row items-center">
        {/* Driver Avatar */}
        <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center mr-4">
          <Text className="text-2xl">👤</Text>
        </View>

        {/* Driver Details */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-secondary">{name}</Text>
          <View className="flex-row items-center mt-1">
            <Star size={16} color={Colors.primary} fill={Colors.primary} />
            <Text className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</Text>
          </View>
          <Text className="text-sm text-gray-500 mt-1">{vehicleModel}</Text>
          <Text className="text-base font-medium text-secondary">{vehicleNumber}</Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row">
          {onCall && (
            <View className="w-12 h-12 bg-success/10 rounded-full items-center justify-center mr-2">
              <Phone size={20} color={Colors.success} />
            </View>
          )}
          {onMessage && (
            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
              <MessageCircle size={20} color={Colors.primary} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default DriverCard;
