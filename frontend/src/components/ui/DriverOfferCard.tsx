import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Star, MessageCircle, Clock, MapPin, Check, User } from 'lucide-react-native';
import { Colors } from '../../config/colors';
import { DriverOffer } from '../../types';

interface DriverOfferCardProps {
  offer: DriverOffer;
  onAccept: (offerId: string) => void;
  onCounter: (offerId: string) => void;
  onChat: (offerId: string) => void;
  onViewProfile: (offerId: string) => void;
  passengerOffer: number;
}

export const DriverOfferCard: React.FC<DriverOfferCardProps> = ({
  offer,
  onAccept,
  onCounter,
  onChat,
  onViewProfile,
  passengerOffer,
}) => {
  const { driver, offeredFare, eta, distance, priceComparison, status, counterOffers } = offer;
  
  const getPriceComparisonStyle = () => {
    switch (priceComparison) {
      case 'below':
        return { text: 'Below your offer', color: Colors.success, bg: 'bg-green-50' };
      case 'equal':
        return { text: 'Your offer', color: Colors.primary, bg: 'bg-yellow-50' };
      case 'above':
        return { text: 'Above your offer', color: Colors.warning, bg: 'bg-orange-50' };
      default:
        return { text: '', color: Colors.gray500, bg: 'bg-gray-50' };
    }
  };
  
  const priceStyle = getPriceComparisonStyle();
  const latestCounter = counterOffers?.[counterOffers.length - 1];
  const displayFare = latestCounter ? latestCounter.amount : offeredFare;
  
  const isAccepted = status === 'accepted';
  const isCountered = status === 'countered';

  return (
    <View className={`bg-white rounded-2xl shadow-lg mb-4 overflow-hidden ${isAccepted ? 'border-2 border-green-500' : ''}`}>
      {/* Status Banner */}
      {isAccepted && (
        <View className="bg-green-500 py-2 px-4">
          <Text className="text-white font-semibold text-center">✓ Offer Accepted</Text>
        </View>
      )}
      
      <View className="p-4">
        {/* Header: Driver Info & Price */}
        <View className="flex-row">
          {/* Driver Photo */}
          <TouchableOpacity onPress={() => onViewProfile(offer._id)} className="mr-3">
            <View className="relative">
              {driver.photo ? (
                <Image
                  source={{ uri: driver.photo }}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                  <User size={32} color={Colors.gray400} />
                </View>
              )}
              {/* Online indicator */}
              <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </View>
            {/* Vehicle thumbnail */}
            {driver.vehicle?.photo && (
              <Image
                source={{ uri: driver.vehicle.photo }}
                className="w-10 h-6 rounded mt-1 self-center"
              />
            )}
          </TouchableOpacity>
          
          {/* Driver Details */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-lg font-semibold text-secondary">{driver.name}</Text>
              <View className="flex-row items-center ml-2 bg-gray-100 px-2 py-0.5 rounded">
                <Star size={12} color={Colors.warning} fill={Colors.warning} />
                <Text className="text-sm font-medium text-secondary ml-1">{driver.rating.toFixed(1)}</Text>
              </View>
            </View>
            
            <Text className="text-sm text-gray-500">
              {driver.vehicle?.make} {driver.vehicle?.model} • {driver.vehicle?.color}
            </Text>
            <Text className="text-xs text-gray-400">{driver.vehicle?.licensePlate}</Text>
            
            <View className="flex-row items-center mt-1">
              <Text className="text-xs text-gray-500">{driver.totalRides.toLocaleString()} rides</Text>
              <Text className="text-xs text-gray-300 mx-2">•</Text>
              <Text className="text-xs text-gray-500">{driver.acceptanceRate}% acceptance</Text>
            </View>
          </View>
          
          {/* Price Section */}
          <View className="items-end">
            <Text className="text-2xl font-bold text-secondary">NPR{Math.round(displayFare)}</Text>
            <View className={`px-2 py-0.5 rounded-full ${priceStyle.bg} mt-1`}>
              <Text className="text-xs" style={{ color: priceStyle.color }}>{priceStyle.text}</Text>
            </View>
            {latestCounter && (
              <Text className="text-xs text-gray-400 mt-1">
                {latestCounter.from === 'driver' ? 'Driver countered' : 'Your counter'}
              </Text>
            )}
          </View>
        </View>
        
        {/* ETA & Distance */}
        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center flex-1">
            <Clock size={14} color={Colors.gray500} />
            <Text className="text-sm text-gray-600 ml-1">{eta} min away</Text>
          </View>
          <View className="flex-row items-center">
            <MapPin size={14} color={Colors.gray500} />
            <Text className="text-sm text-gray-600 ml-1">{distance.toFixed(1)} km</Text>
          </View>
        </View>
        
        {/* Counter Offer History */}
        {counterOffers && counterOffers.length > 0 && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs text-gray-500 mb-2">Negotiation history:</Text>
            {counterOffers.slice(-3).map((counter, idx) => (
              <View key={counter._id} className="flex-row items-center mb-1">
                <View className={`w-2 h-2 rounded-full ${counter.from === 'passenger' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                <Text className="text-xs text-gray-600 ml-2">
                  {counter.from === 'passenger' ? 'You' : 'Driver'}: NPR{Math.round(counter.amount)}
                </Text>
                {counter.message && (
                  <Text className="text-xs text-gray-400 ml-2">"{counter.message}"</Text>
                )}
              </View>
            ))}
          </View>
        )}
        
        {/* Action Buttons */}
        {!isAccepted && (
          <View className="flex-row items-center mt-4 pt-3 border-t border-gray-100">
            <TouchableOpacity
              onPress={() => onChat(offer._id)}
              className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3"
            >
              <MessageCircle size={20} color={Colors.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => onCounter(offer._id)}
              className="flex-1 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3"
            >
              <Text className="text-sm font-semibold text-secondary">Counter Offer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => onAccept(offer._id)}
              className="flex-1 h-12 rounded-xl bg-primary items-center justify-center flex-row"
            >
              <Check size={18} color={Colors.secondary} />
              <Text className="text-sm font-semibold text-secondary ml-1">Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default DriverOfferCard;
