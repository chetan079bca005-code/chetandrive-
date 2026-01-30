import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Check, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react-native';
import { Colors } from '../../config/colors';
import { VehicleType } from '../../types';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface VehicleCardProps {
  id: VehicleType;
  name: string;
  description: string;
  fare: number;
  eta: string;
  seats: number;
  isSelected: boolean;
  onSelect: (id: VehicleType) => void;
  offerFare?: number;
  onOfferFareChange?: (fare: number) => void;
  showOfferSection?: boolean;
}

const vehicleEmojis: Record<VehicleType, string> = {
  bike: '🏍️',
  auto: '🛺',
  cabEconomy: '🚗',
  cabPremium: '🚙',
};

export const VehicleCard: React.FC<VehicleCardProps> = ({
  id,
  name,
  description,
  fare,
  eta,
  seats,
  isSelected,
  onSelect,
  offerFare,
  onOfferFareChange,
  showOfferSection = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentOfferFare = offerFare ?? Math.round(fare);

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleIncreaseFare = () => {
    if (onOfferFareChange) {
      onOfferFareChange(currentOfferFare + 10);
    }
  };

  const handleDecreaseFare = () => {
    if (onOfferFareChange) {
      const minFare = Math.round(fare * 0.7); // Minimum 70% of base fare
      onOfferFareChange(Math.max(minFare, currentOfferFare - 10));
    }
  };

  const getFareComparison = () => {
    const diff = currentOfferFare - Math.round(fare);
    if (diff < 0) return { text: `NPR${Math.abs(diff)} below`, color: 'text-orange-500' };
    if (diff > 0) return { text: `NPR${diff} above`, color: 'text-green-600' };
    return { text: 'Recommended', color: 'text-gray-500' };
  };

  const comparison = getFareComparison();

  return (
    <View className="mb-3">
      <TouchableOpacity
        onPress={() => {
          onSelect(id);
          if (!isExpanded && showOfferSection) {
            handleToggleExpand();
          }
        }}
        className={`
          flex-row items-center p-4 rounded-t-2xl ${!isExpanded && !isSelected ? 'rounded-b-2xl' : ''}
          ${isSelected ? 'bg-primary/10 border-2 border-b-0 border-primary' : 'bg-gray-50 border-2 border-transparent'}
        `}
        activeOpacity={0.7}
      >
        {/* Vehicle Emoji */}
        <View className="w-14 h-14 bg-white rounded-xl items-center justify-center mr-3 shadow-sm">
          <Text className="text-3xl">{vehicleEmojis[id]}</Text>
        </View>

        {/* Vehicle Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-secondary">{name}</Text>
            <Text className="text-base font-semibold text-secondary">
              NPR{isSelected && onOfferFareChange ? currentOfferFare : Math.round(fare)}
            </Text>
          </View>
          <View className="flex-row items-center mt-0.5">
            <Text className="text-xs text-gray-500">{seats} seats • {eta}</Text>
          </View>
          <Text className="text-xs text-gray-500 mt-0.5">{description}</Text>
        </View>

        {/* Selection/Expand Indicator */}
        <View className="ml-2">
          {isSelected ? (
            <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
              <Check size={14} color={Colors.secondary} />
            </View>
          ) : (
            showOfferSection && (
              <View className="w-6 h-6 items-center justify-center">
                <ChevronDown size={18} color={Colors.gray400} />
              </View>
            )
          )}
        </View>
      </TouchableOpacity>

      {/* Offer Fare Section - Dropdown */}
      {isSelected && showOfferSection && onOfferFareChange && (
        <View
          className={`
            bg-primary/5 px-4 py-3 rounded-b-2xl border-2 border-t-0 border-primary
          `}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-gray-600 font-medium">Your offer</Text>
              <Text className={`text-xs ${comparison.color}`}>{comparison.text}</Text>
            </View>

            <View className="flex-row items-center bg-white rounded-xl px-2 py-1">
              <TouchableOpacity
                onPress={handleDecreaseFare}
                className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center"
                activeOpacity={0.7}
              >
                <Minus size={16} color={Colors.secondary} />
              </TouchableOpacity>
              
              <View className="mx-3 items-center min-w-[80px]">
                <Text className="text-lg font-bold text-secondary">NPR{currentOfferFare}</Text>
              </View>
              
              <TouchableOpacity
                onPress={handleIncreaseFare}
                className="w-8 h-8 rounded-lg bg-primary items-center justify-center"
                activeOpacity={0.7}
              >
                <Plus size={16} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text className="text-[10px] text-gray-400 mt-2 text-center">
            Drivers can accept, counter, or decline your offer
          </Text>
        </View>
      )}
    </View>
  );
};

export default VehicleCard;
