import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { Colors } from '../../config/colors';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isAuthenticated, isOnboarded, tokens, setTokens, logout, setLoading } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [dot1] = useState(new Animated.Value(0.3));
  const [dot2] = useState(new Animated.Value(0.3));
  const [dot3] = useState(new Animated.Value(0.3));

  useEffect(() => {
    // Animate dots
    const animateDots = () => {
      const createAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            ])
          ),
        ]);
      };

      Animated.parallel([
        createAnimation(dot1, 0),
        createAnimation(dot2, 200),
        createAnimation(dot3, 400),
      ]).start();
    };

    animateDots();

    return () => {};
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      if (tokens?.refresh_token) {
        try {
          const refreshed = await authService.refreshToken({
            refresh_token: tokens.refresh_token,
          });
          setTokens(refreshed);
        } catch {
          logout();
        }
      }
      setLoading(false);
      setIsBootstrapping(false);
    };

    bootstrap();
  }, [tokens?.refresh_token, logout, setTokens, setLoading]);

  useEffect(() => {
    if (isBootstrapping) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace('MainDrawer');
      } else if (isOnboarded) {
        navigation.replace('Login');
      } else {
        navigation.replace('Onboarding');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isOnboarded, navigation, isBootstrapping]);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark] as const}
      className="flex-1 items-center justify-center"
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
      
      {/* Logo */}
      <View className="items-center">
        <View className="w-24 h-24 bg-secondary rounded-3xl items-center justify-center mb-6 shadow-lg">
          <Text className="text-5xl">🚕</Text>
        </View>
        
        <Text className="text-4xl font-bold text-secondary tracking-wide">
          ChetanDrive
        </Text>
        <Text className="text-lg text-secondary/70 mt-2">
          Ride Nepal with ease
        </Text>
      </View>

      {/* Loading indicator */}
      <View className="absolute bottom-20">
        <View className="flex-row space-x-2">
          <Animated.View
            className="w-2 h-2 bg-secondary rounded-full mx-1"
            style={{ opacity: dot1 }}
          />
          <Animated.View
            className="w-2 h-2 bg-secondary rounded-full mx-1"
            style={{ opacity: dot2 }}
          />
          <Animated.View
            className="w-2 h-2 bg-secondary rounded-full mx-1"
            style={{ opacity: dot3 }}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

export default SplashScreen;
