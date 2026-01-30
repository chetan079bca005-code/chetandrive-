import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Phone, ChevronRight } from 'lucide-react-native';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { Colors } from '../../config/colors';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { login, setLoading } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'rider'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (phone: string) => {
    const phoneRegex = /^9[78]\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleContinue = async () => {
    setError('');

    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit Nepali phone number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({
        phone: phone.trim(),
        role: selectedRole,
      });

      login(response.user, {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      });

      navigation.replace('MainDrawer');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to login. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-8">
            {/* Header */}
            <View className="mb-12">
              <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-6">
                <Text className="text-3xl">🚕</Text>
              </View>
              <Text className="text-3xl font-bold text-secondary mb-2">
                Welcome to ChetanDrive
              </Text>
              <Text className="text-base text-gray-500">
                Enter your phone number to continue
              </Text>
            </View>

            {/* Role Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                I want to
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setSelectedRole('customer')}
                  className={`flex-1 py-4 rounded-xl mr-2 border-2 ${
                    selectedRole === 'customer'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-gray-50 border-transparent'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      selectedRole === 'customer'
                        ? 'text-secondary'
                        : 'text-gray-500'
                    }`}
                  >
                    🚶 Book a Ride
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedRole('rider')}
                  className={`flex-1 py-4 rounded-xl ml-2 border-2 ${
                    selectedRole === 'rider'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-gray-50 border-transparent'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      selectedRole === 'rider'
                        ? 'text-secondary'
                        : 'text-gray-500'
                    }`}
                  >
                    🚗 Drive & Earn
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl overflow-hidden">
                <View className="px-4 py-4 bg-gray-200 flex-row items-center">
                  <Text className="text-lg mr-1">🇳🇵</Text>
                  <Text className="text-base font-medium text-secondary">+977</Text>
                </View>
                <View className="flex-1">
                  <Input
                    placeholder="Enter phone number"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text.replace(/[^0-9]/g, '').slice(0, 10));
                      setError('');
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    error={error}
                    className="mb-0"
                    inputClassName="bg-transparent"
                  />
                </View>
              </View>
            </View>

            {/* Continue Button */}
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={isLoading}
              disabled={!phone || isLoading}
              icon={<ChevronRight size={20} color={Colors.secondary} />}
              iconPosition="right"
            />

            {/* Terms */}
            <Text className="text-center text-sm text-gray-500 mt-6 leading-5">
              By continuing, you agree to our{' '}
              <Text className="text-secondary font-medium">Terms of Service</Text>
              {' '}and{' '}
              <Text className="text-secondary font-medium">Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
