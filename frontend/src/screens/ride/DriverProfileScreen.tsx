import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  Star,
  Shield,
  Calendar,
  Check,
  MessageCircle,
  Phone,
  User,
  Car,
} from 'lucide-react-native';
import { Colors } from '../../config/colors';
import { DriverOffer } from '../../types';

type RouteParams = {
  DriverProfile: {
    offer: DriverOffer;
  };
};

export const DriverProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'DriverProfile'>>();
  const { offer } = route.params;
  const { driver } = offer;

  // Mock reviews
  const reviews = [
    {
      id: '1',
      name: 'Priya S.',
      rating: 5,
      comment: 'Very polite and professional driver. Car was clean and comfortable.',
      date: '2 days ago',
    },
    {
      id: '2',
      name: 'Raj K.',
      rating: 5,
      comment: 'On time pickup, smooth ride. Highly recommended!',
      date: '1 week ago',
    },
    {
      id: '3',
      name: 'Anita M.',
      rating: 4,
      comment: 'Good experience overall. Knew the routes well.',
      date: '2 weeks ago',
    },
  ];

  const ratingBreakdown = [
    { stars: 5, percentage: 85 },
    { stars: 4, percentage: 10 },
    { stars: 3, percentage: 3 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 1 },
  ];

  const handleAccept = () => {
    // Navigate back and trigger accept
    navigation.goBack();
  };

  const handleChat = () => {
    navigation.navigate('Chat', { offerId: offer._id, driver });
  };

  const handleCall = () => {
    console.log('Calling driver...');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />

      {/* Header with Driver Photo */}
      <View className="bg-secondary pt-12 pb-20">
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center px-4">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text className="flex-1 text-lg font-semibold text-white text-center mr-10">
              Driver Profile
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView className="flex-1 -mt-16" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="mx-4 bg-white rounded-2xl shadow-lg p-6 mb-4">
          {/* Avatar & Basic Info */}
          <View className="items-center -mt-16 mb-4">
            <View className="relative">
              {driver.photo ? (
                <Image
                  source={{ uri: driver.photo }}
                  className="w-24 h-24 rounded-full border-4 border-white"
                />
              ) : (
                <View className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 items-center justify-center">
                  <User size={48} color={Colors.gray400} />
                </View>
              )}
              <View className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
            </View>
            
            <Text className="text-xl font-bold text-secondary mt-3">{driver.name}</Text>
            
            <View className="flex-row items-center mt-1">
              <Star size={18} color={Colors.warning} fill={Colors.warning} />
              <Text className="text-lg font-semibold text-secondary ml-1">
                {driver.rating.toFixed(1)}
              </Text>
              <Text className="text-gray-500 ml-2">
                ({driver.totalRides.toLocaleString()} rides)
              </Text>
            </View>

            {/* Badges */}
            <View className="flex-row mt-3">
              {driver.verificationBadges.map((badge, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center bg-green-50 px-3 py-1 rounded-full mx-1"
                >
                  <Shield size={12} color={Colors.success} />
                  <Text className="text-xs text-green-700 ml-1">{badge}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row border-t border-gray-100 pt-4">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-secondary">
                {driver.acceptanceRate}%
              </Text>
              <Text className="text-xs text-gray-500">Acceptance</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-secondary">
                {driver.cancellationRate}%
              </Text>
              <Text className="text-xs text-gray-500">Cancellation</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <View className="flex-row items-center">
                <Calendar size={14} color={Colors.gray500} />
                <Text className="text-lg font-bold text-secondary ml-1">
                  {driver.memberSince}
                </Text>
              </View>
              <Text className="text-xs text-gray-500">Member Since</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Card */}
        <View className="mx-4 bg-white rounded-2xl shadow-lg p-4 mb-4">
          <Text className="text-base font-semibold text-secondary mb-3">Vehicle Details</Text>
          
          <View className="flex-row items-center">
            {driver.vehicle?.photo ? (
              <Image
                source={{ uri: driver.vehicle.photo }}
                className="w-24 h-16 rounded-lg"
              />
            ) : (
              <View className="w-24 h-16 rounded-lg bg-gray-100 items-center justify-center">
                <Car size={32} color={Colors.gray400} />
              </View>
            )}
            
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-secondary">
                {driver.vehicle?.make} {driver.vehicle?.model}
              </Text>
              <Text className="text-sm text-gray-500">{driver.vehicle?.color} • {driver.vehicle?.year}</Text>
              <View className="flex-row items-center mt-1">
                <View className="bg-gray-100 px-2 py-1 rounded">
                  <Text className="text-xs font-medium text-secondary">
                    {driver.vehicle?.licensePlate}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500 ml-2">
                  {driver.vehicle?.capacity} passengers
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rating Breakdown */}
        <View className="mx-4 bg-white rounded-2xl shadow-lg p-4 mb-4">
          <Text className="text-base font-semibold text-secondary mb-3">Rating Breakdown</Text>
          
          {ratingBreakdown.map((item) => (
            <View key={item.stars} className="flex-row items-center mb-2">
              <Text className="w-4 text-sm text-gray-600">{item.stars}</Text>
              <Star size={12} color={Colors.warning} fill={Colors.warning} className="ml-1" />
              <View className="flex-1 h-2 bg-gray-100 rounded-full mx-3">
                <View
                  className="h-2 bg-yellow-400 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </View>
              <Text className="w-10 text-xs text-gray-500 text-right">{item.percentage}%</Text>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <View className="mx-4 bg-white rounded-2xl shadow-lg p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-secondary">Recent Reviews</Text>
            <TouchableOpacity>
              <Text className="text-sm text-primary">See all</Text>
            </TouchableOpacity>
          </View>
          
          {reviews.map((review) => (
            <View key={review.id} className="border-t border-gray-100 pt-3 mt-3 first:border-0 first:pt-0 first:mt-0">
              <View className="flex-row items-center justify-between">
                <Text className="font-medium text-secondary">{review.name}</Text>
                <View className="flex-row items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      color={Colors.warning}
                      fill={star <= review.rating ? Colors.warning : 'none'}
                    />
                  ))}
                </View>
              </View>
              <Text className="text-sm text-gray-600 mt-1">{review.comment}</Text>
              <Text className="text-xs text-gray-400 mt-1">{review.date}</Text>
            </View>
          ))}
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView
        edges={['bottom']}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100"
      >
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-500">Driver's Offer</Text>
              <Text className="text-2xl font-bold text-secondary">
                NPR{Math.round(offer.offeredFare)}
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={handleCall}
              className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3"
            >
              <Phone size={20} color={Colors.success} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleChat}
              className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center"
            >
              <MessageCircle size={20} color={Colors.info} />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex-1 py-4 bg-gray-100 rounded-xl mr-2"
            >
              <Text className="text-center font-semibold text-secondary">Counter Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAccept}
              className="flex-1 py-4 bg-primary rounded-xl ml-2 flex-row items-center justify-center"
            >
              <Check size={18} color={Colors.secondary} />
              <Text className="text-center font-semibold text-secondary ml-1">Accept Offer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default DriverProfileScreen;
