import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, ArrowLeft } from 'lucide-react-native';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { Colors } from '../../config/colors';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { login } = useAuthStore();
  const [step, setStep] = useState<'email' | 'otp' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputRef = useRef<TextInput>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^9[78]\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSendCode = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyPhone({ email: email.trim() });
      
      setIsLoading(false);
      setStep('otp');
      setTimeout(() => otpInputRef.current?.focus(), 500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send code. Try again later.');
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndLogin = async () => {
    setError('');
    
    if (otp.length < 4) {
      setError('Please enter the code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({
        email: email.trim(),
        otp,
      });

      login(response.user, {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      });

      if (!response.user.phone) {
         setStep('phone');
      } else {
         navigation.replace('MainDrawer');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.msg ||
        'Failed to login. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (!phone.trim() || !validatePhone(phone.trim())) {
      setError('Please enter a valid 10-digit Nepali phone number');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await authService.updateProfile({ phone: phone.trim() });
      login(resp.user, { access_token: useAuthStore.getState().tokens?.access_token || '', refresh_token: useAuthStore.getState().tokens?.refresh_token || '' });
      navigation.replace('MainDrawer');
    } catch(err: any) {
      setError(err.response?.data?.message || 'Failed to save phone number.');
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
            {step === 'otp' && (
              <TouchableOpacity 
                onPress={() => setStep('email')} 
                className="mb-6 w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <ArrowLeft size={24} color={Colors.secondary} />
              </TouchableOpacity>
            )}

            {/* Header */}
            <View className="mb-10">
              {step === 'email' ? (
                <>
                  <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-6">
                    <Text className="text-3xl">🚖</Text>
                  </View>
                  <Text className="text-3xl font-bold text-secondary mb-2">
                    Welcome
                  </Text>
                  <Text className="text-base text-gray-500">
                    Sign up or log in to continue
                  </Text>
                </>
              ) : step === 'otp' ? (
                <>
                  <Text className="text-3xl font-bold text-secondary mb-2">
                    Enter Code
                  </Text>
                  <Text className="text-base text-gray-500">
                    We sent a code to {email}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-3xl font-bold text-secondary mb-2">
                    Phone Number
                  </Text>
                  <Text className="text-base text-gray-500">
                    Let's ensure we can contact you
                  </Text>
                </>
              )}
            </View>

            {step === 'email' ? (
              <>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={error}
                  editable={!isLoading}
                />

                <Button
                  title="Continue"
                  onPress={handleSendCode}
                  loading={isLoading}
                  className="mt-4 shadow-sm"
                  rightIcon={<ChevronRight size={20} color={Colors.white} />}
                />
              </>
            ) : step === 'otp' ? (
              <>
                 <View className="mb-6 items-center">
                  <TextInput
                    ref={otpInputRef}
                    className="text-4xl font-bold tracking-[10px] text-center border-b-2 border-primary w-2/3 pb-2 text-secondary"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val.replace(/[^0-9]/g, ''));
                      setError('');
                    }}
                    placeholder="----"
                    placeholderTextColor={Colors.gray400}
                  />
                  {error ? (
                    <Text className="text-red-500 text-sm mt-3">{error}</Text>
                  ) : null}
                </View>

                <Button
                  title="Verify & Login"
                  onPress={handleVerifyOtpAndLogin}
                  loading={isLoading}
                  disabled={otp.length < 4 || isLoading}
                  className="mt-4 shadow-sm"
                />
                
                <TouchableOpacity 
                  className="mt-6 p-2"
                  disabled={isLoading}
                  onPress={() => {
                    setStep('email');
                    setOtp('');
                  }}
                >
                  <Text className="text-center text-primary font-medium text-base">
                    Didn't receive code? Change Email
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Input
                  label="Phone Number"
                  placeholder="Enter 10-digit Nepali number"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/[^0-9]/g, ''));
                    setError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={10}
                  error={error}
                  editable={!isLoading}
                />

                <Button
                  title="Save Phone Number"
                  onPress={handleSavePhone}
                  loading={isLoading}
                  className="mt-4 shadow-sm"
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
