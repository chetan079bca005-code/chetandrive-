import React, { useState, useEffect, useRef } from 'react';
import { View, Text, PanResponder, Animated, Dimensions } from 'react-native';
import { Colors } from '../../config/colors';

interface PriceSliderProps {
  value: number;
  minPrice: number;
  maxPrice: number;
  recommendedPrice: number;
  onValueChange: (value: number) => void;
  step?: number;
  currency?: string;
}

const SLIDER_WIDTH = Dimensions.get('window').width - 64; // 32px padding on each side

export const PriceSlider: React.FC<PriceSliderProps> = ({
  value,
  minPrice,
  maxPrice,
  recommendedPrice,
  onValueChange,
  step = 10,
  currency = 'NPR',
}) => {
  const pan = useRef(new Animated.Value(0)).current;
  const [sliderValue, setSliderValue] = useState(value);
  
  // Calculate positions
  const priceRange = maxPrice - minPrice;
  const valueToPosition = (val: number) => ((val - minPrice) / priceRange) * SLIDER_WIDTH;
  const positionToValue = (pos: number) => {
    const rawValue = (pos / SLIDER_WIDTH) * priceRange + minPrice;
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minPrice, Math.min(maxPrice, steppedValue));
  };
  
  const recommendedPosition = valueToPosition(recommendedPrice);
  
  useEffect(() => {
    const position = valueToPosition(value);
    pan.setValue(position);
    setSliderValue(value);
  }, [value]);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset((pan as any)._value);
        pan.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(0, Math.min(SLIDER_WIDTH, (pan as any)._offset + gestureState.dx));
        pan.setValue(gestureState.dx);
        const newValue = positionToValue(newPosition);
        setSliderValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        const finalPosition = Math.max(0, Math.min(SLIDER_WIDTH, (pan as any)._value));
        pan.setValue(finalPosition);
        const finalValue = positionToValue(finalPosition);
        setSliderValue(finalValue);
        onValueChange(finalValue);
      },
    })
  ).current;
  
  const getPriceIndicator = () => {
    if (sliderValue < recommendedPrice - step * 2) {
      return { text: 'Low offer', color: Colors.danger, emoji: '😕' };
    } else if (sliderValue <= recommendedPrice + step * 2) {
      return { text: 'Good offer', color: Colors.success, emoji: '👍' };
    } else {
      return { text: 'High offer', color: Colors.primary, emoji: '🎉' };
    }
  };
  
  const indicator = getPriceIndicator();
  
  return (
    <View className="py-4">
      {/* Current Value Display */}
      <View className="items-center mb-4">
        <Text className="text-3xl font-bold text-secondary">{currency}{Math.round(sliderValue)}</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-lg mr-1">{indicator.emoji}</Text>
          <Text className="text-sm" style={{ color: indicator.color }}>{indicator.text}</Text>
        </View>
      </View>
      
      {/* Slider Track */}
      <View className="relative h-12 justify-center px-4">
        {/* Background Track */}
        <View className="h-2 bg-gray-200 rounded-full" style={{ width: SLIDER_WIDTH }} />
        
        {/* Colored Track (filled portion) */}
        <Animated.View
          className="absolute h-2 rounded-full"
          style={{
            width: pan,
            backgroundColor: indicator.color,
            left: 16,
          }}
        />
        
        {/* Recommended Price Marker */}
        <View
          className="absolute w-0.5 h-4 bg-gray-400"
          style={{ left: recommendedPosition + 16 }}
        />
        <View
          className="absolute -top-5 px-2 py-0.5 bg-gray-700 rounded"
          style={{ left: recommendedPosition + 16 - 30 }}
        >
          <Text className="text-xs text-white">Suggested</Text>
        </View>
        
        {/* Thumb */}
        <Animated.View
          {...panResponder.panHandlers}
          className="absolute w-8 h-8 rounded-full bg-white shadow-lg items-center justify-center border-2"
          style={{
            transform: [{ translateX: Animated.subtract(pan, 16) }],
            borderColor: indicator.color,
            left: 16,
          }}
        >
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: indicator.color }} />
        </Animated.View>
      </View>
      
      {/* Price Labels */}
      <View className="flex-row justify-between px-4 mt-2">
        <View className="items-start">
          <Text className="text-xs text-gray-400">Min</Text>
          <Text className="text-sm text-gray-600">{currency}{minPrice}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-gray-400">Recommended</Text>
          <Text className="text-sm font-semibold text-secondary">{currency}{recommendedPrice}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-gray-400">Max</Text>
          <Text className="text-sm text-gray-600">{currency}{maxPrice}</Text>
        </View>
      </View>
      
      {/* Quick Adjust Buttons */}
      <View className="flex-row justify-center mt-4 space-x-3">
        {[-50, -10, +10, +50].map((adjustment) => (
          <View key={adjustment} className="mx-1">
            <View
              className="px-4 py-2 rounded-full bg-gray-100"
              onTouchEnd={() => {
                const newValue = Math.max(minPrice, Math.min(maxPrice, sliderValue + adjustment));
                setSliderValue(newValue);
                onValueChange(newValue);
                pan.setValue(valueToPosition(newValue));
              }}
            >
              <Text className="text-sm font-medium text-secondary">
                {adjustment > 0 ? '+' : ''}{adjustment}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PriceSlider;
