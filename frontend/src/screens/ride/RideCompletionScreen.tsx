import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  Check,
  Star,
  Receipt,
  Home,
  Car,
  User,
  MapPin,
  Clock,
  Navigation,
} from 'lucide-react-native';
import { useRideStore } from '../../store';
import { Colors } from '../../config/colors';
import { FeedbackTag } from '../../types';

type RouteParams = {
  RideCompletion: {
    rideId: string;
  };
};

const positiveTags: FeedbackTag[] = [
  { id: '1', label: 'Great Service', icon: '⭐', type: 'positive' },
  { id: '2', label: 'Clean Car', icon: '✨', type: 'positive' },
  { id: '3', label: 'Safe Driving', icon: '🛡️', type: 'positive' },
  { id: '4', label: 'Friendly', icon: '😊', type: 'positive' },
  { id: '5', label: 'On Time', icon: '⏰', type: 'positive' },
  { id: '6', label: 'Good Music', icon: '🎵', type: 'positive' },
];

const negativeTags: FeedbackTag[] = [
  { id: '1', label: 'Route Issue', icon: '🗺️', type: 'negative' },
  { id: '2', label: 'Driver Behavior', icon: '😔', type: 'negative' },
  { id: '3', label: 'Vehicle Condition', icon: '🚗', type: 'negative' },
  { id: '4', label: 'Safety Concern', icon: '⚠️', type: 'negative' },
  { id: '5', label: 'Late Arrival', icon: '⏱️', type: 'negative' },
];

const tipOptions = [
  { amount: 0, label: 'No Thanks' },
  { amount: 20, label: 'NPR20' },
  { amount: 50, label: 'NPR50' },
  { amount: 100, label: 'NPR100' },
];

export const RideCompletionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'RideCompletion'>>();
  const { currentRide, clearRide } = useRideStore();

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [selectedTip, setSelectedTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const confettiAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animation
    Animated.sequence([
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Mock ride data
  const rideData = currentRide || {
    _id: 'mock_ride',
    pickup: { address: 'Thamel, Kathmandu', latitude: 0, longitude: 0 },
    drop: { address: 'Patan Durbar Square', latitude: 0, longitude: 0 },
    fare: 250,
    distance: 5.2,
    vehicle: 'cabEconomy',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const driverData = {
    name: 'Ram Sharma',
    photo: null,
    rating: 4.8,
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      licensePlate: 'BA 1 PA 1234',
    },
  };

  const fareBreakdown = {
    baseFare: 50,
    distanceCharge: Math.round(rideData.distance * 30),
    timeCharge: 50,
    waitingTime: 0,
    toll: 0,
    discount: 0,
    total: rideData.fare,
  };

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex);
    setSelectedTags([]); // Reset tags when rating changes
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // In production: await rideService.rateRide({ ... })
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowSuccess(true);

      setTimeout(() => {
        clearRide();
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDrawer' }],
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    clearRide();
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainDrawer' }],
    });
  };

  const formatDuration = () => {
    const start = new Date(rideData.createdAt);
    const end = new Date(rideData.updatedAt);
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${mins} min`;
  };

  const tags = rating >= 4 ? positiveTags : negativeTags;

  if (showSuccess) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Animated.View
          style={{
            transform: [
              {
                scale: checkAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1.2, 1],
                }),
              },
            ],
          }}
        >
          <View className="w-24 h-24 rounded-full bg-green-500 items-center justify-center mb-6">
            <Check size={48} color={Colors.white} strokeWidth={3} />
          </View>
        </Animated.View>
        <Text className="text-2xl font-bold text-secondary mb-2">Thank You!</Text>
        <Text className="text-gray-500 text-center px-8">
          Your feedback helps us improve the ride experience for everyone
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Success Header */}
          <View className="items-center pt-6 pb-4">
            <Animated.View
              className="w-20 h-20 rounded-full bg-green-500 items-center justify-center mb-4"
              style={{
                transform: [
                  {
                    scale: checkAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.2, 1],
                    }),
                  },
                ],
              }}
            >
              <Check size={40} color={Colors.white} strokeWidth={3} />
            </Animated.View>
            <Text className="text-2xl font-bold text-secondary">Ride Completed!</Text>
            <Text className="text-gray-500 mt-1">Thank you for riding with us</Text>
          </View>

          {/* Trip Summary Card */}
          <View className="mx-4 bg-gray-50 rounded-2xl p-4 mb-4">
            {/* Route */}
            <View className="flex-row items-start mb-4">
              <View className="items-center mr-3">
                <View className="w-3 h-3 rounded-full bg-green-500" />
                <View className="w-0.5 h-8 bg-gray-300 my-1" />
                <View className="w-3 h-3 rounded-full bg-red-500" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {rideData.pickup.address}
                </Text>
                <View className="h-6" />
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {rideData.drop.address}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row border-t border-gray-200 pt-3">
              <View className="flex-1 flex-row items-center">
                <Navigation size={14} color={Colors.gray500} />
                <Text className="text-sm text-gray-600 ml-1">{rideData.distance} km</Text>
              </View>
              <View className="flex-1 flex-row items-center justify-center">
                <Clock size={14} color={Colors.gray500} />
                <Text className="text-sm text-gray-600 ml-1">{formatDuration()}</Text>
              </View>
              <View className="flex-1 flex-row items-center justify-end">
                <Text className="text-sm text-gray-500">Cash</Text>
              </View>
            </View>
          </View>

          {/* Fare Breakdown */}
          <View className="mx-4 bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-semibold text-secondary">Fare Breakdown</Text>
              <TouchableOpacity className="flex-row items-center">
                <Receipt size={16} color={Colors.primary} />
                <Text className="text-sm text-primary ml-1">Get Receipt</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Base fare</Text>
                <Text className="text-secondary">NPR{fareBreakdown.baseFare}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Distance ({rideData.distance} km)</Text>
                <Text className="text-secondary">NPR{fareBreakdown.distanceCharge}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Time charge</Text>
                <Text className="text-secondary">NPR{fareBreakdown.timeCharge}</Text>
              </View>
              {fareBreakdown.discount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-green-600">Discount</Text>
                  <Text className="text-green-600">-NPR{fareBreakdown.discount}</Text>
                </View>
              )}
            </View>

            <View className="flex-row justify-between border-t border-gray-200 mt-3 pt-3">
              <Text className="text-lg font-bold text-secondary">Total</Text>
              <Text className="text-lg font-bold text-secondary">NPR{fareBreakdown.total}</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View className="mx-4 bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            <Text className="text-center font-semibold text-secondary mb-2">
              How was your ride with {driverData.name}?
            </Text>

            {/* Driver Info */}
            <View className="flex-row items-center justify-center mb-4">
              {driverData.photo ? (
                <Image
                  source={{ uri: driverData.photo }}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                  <User size={32} color={Colors.gray400} />
                </View>
              )}
            </View>

            {/* Stars */}
            <View className="flex-row justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  className="mx-2"
                >
                  <Star
                    size={40}
                    color={Colors.warning}
                    fill={star <= rating ? Colors.warning : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Feedback Tags */}
            {rating > 0 && (
              <View className="mb-4">
                <Text className="text-sm text-gray-500 text-center mb-3">
                  {rating >= 4 ? 'What went well?' : 'What went wrong?'}
                </Text>
                <View className="flex-row flex-wrap justify-center">
                  {tags.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => toggleTag(tag.id)}
                      className={`flex-row items-center px-3 py-2 rounded-full m-1 ${
                        selectedTags.includes(tag.id)
                          ? rating >= 4
                            ? 'bg-green-100'
                            : 'bg-red-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text className="mr-1">{tag.icon}</Text>
                      <Text
                        className={`text-sm ${
                          selectedTags.includes(tag.id)
                            ? rating >= 4
                              ? 'text-green-700'
                              : 'text-red-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Comment */}
            {rating > 0 && (
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-secondary"
                placeholder="Add a comment (optional)"
                placeholderTextColor={Colors.gray400}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
              />
            )}
          </View>

          {/* Tip Section */}
          {rating >= 4 && (
            <View className="mx-4 bg-white border border-gray-200 rounded-2xl p-4 mb-4">
              <Text className="text-center font-semibold text-secondary mb-1">
                Add a tip for {driverData.name}?
              </Text>
              <Text className="text-center text-sm text-gray-500 mb-4">
                Tips go directly to your driver
              </Text>

              <View className="flex-row justify-center">
                {tipOptions.map((option) => (
                  <TouchableOpacity
                    key={option.amount}
                    onPress={() => setSelectedTip(option.amount)}
                    className={`px-4 py-3 rounded-xl mx-1 ${
                      selectedTip === option.amount
                        ? 'bg-primary'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedTip === option.amount
                          ? 'text-secondary'
                          : 'text-gray-600'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Bottom Actions */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row">
              <TouchableOpacity
                onPress={handleSkip}
                className="flex-1 py-4 bg-gray-100 rounded-xl mr-2"
              >
                <Text className="text-center font-semibold text-secondary">Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-4 rounded-xl ml-2 ${
                  rating > 0 ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    rating > 0 ? 'text-secondary' : 'text-gray-400'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('RideConfirmation')}
              className="flex-row items-center justify-center mt-3 py-2"
            >
              <Car size={16} color={Colors.primary} />
              <Text className="text-primary font-medium ml-2">Book Another Ride</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default RideCompletionScreen;
