import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store';
import { Button } from '../../components/ui';
import { Colors } from '../../config/colors';

const { width, height } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  backgroundColor: readonly [string, string];
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    title: 'You Set Your Price',
    subtitle: 'Propose a fair price for your ride and negotiate with drivers',
    emoji: '💰',
    backgroundColor: [Colors.primary, Colors.primaryDark] as const,
  },
  {
    id: '2',
    title: 'Choose Your Driver',
    subtitle: 'Compare multiple offers and select the best driver for you',
    emoji: '🚗',
    backgroundColor: ['#667eea', '#764ba2'] as const,
  },
  {
    id: '3',
    title: 'Ride with Confidence',
    subtitle: 'Verified drivers, real-time tracking, and 24/7 support for safe journeys',
    emoji: '🛡️',
    backgroundColor: ['#11998e', '#38ef7d'] as const,
  },
  {
    id: '4',
    title: 'Chat & Connect',
    subtitle: 'Message your driver before pickup to coordinate your ride easily',
    emoji: '💬',
    backgroundColor: ['#f093fb', '#f5576c'] as const,
  },
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { setOnboarded } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    setOnboarded(true);
    navigation.replace('Login');
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <LinearGradient
      colors={item.backgroundColor}
      style={{ width, height }}
      className="items-center justify-center px-8"
    >
      {/* Illustration */}
      <View className="w-48 h-48 bg-white/20 rounded-full items-center justify-center mb-12">
        <Text className="text-8xl">{item.emoji}</Text>
      </View>

      {/* Content */}
      <View className="items-center">
        <Text className="text-4xl font-bold text-white text-center mb-4">
          {item.title}
        </Text>
        <Text className="text-lg text-white/80 text-center leading-7">
          {item.subtitle}
        </Text>
      </View>
    </LinearGradient>
  );

  const renderDots = () => (
    <View className="flex-row justify-center items-center space-x-2">
      {onboardingData.map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full ${
            index === currentIndex
              ? 'w-8 bg-white'
              : 'w-2 bg-white/50'
          }`}
        />
      ))}
    </View>
  );

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item: OnboardingItem) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event: { nativeEvent: { contentOffset: { x: number } } }) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom Controls */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-12 pt-6">
        {renderDots()}

        <View className="flex-row mt-8">
          {currentIndex < onboardingData.length - 1 ? (
            <>
              <TouchableOpacity
                onPress={handleSkip}
                className="flex-1 py-4 items-center"
              >
                <Text className="text-white font-medium text-lg">Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                className="flex-1 py-4 bg-white rounded-xl items-center"
              >
                <Text className="text-secondary font-semibold text-lg">Next</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleGetStarted}
              className="flex-1 py-4 bg-white rounded-xl items-center"
            >
              <Text className="text-secondary font-semibold text-lg">Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;
