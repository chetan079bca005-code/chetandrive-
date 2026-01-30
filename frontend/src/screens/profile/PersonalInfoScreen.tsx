import React from 'react';
import { View, Text, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferencesStore, useAuthStore } from '../../store';
import { Colors } from '../../config/colors';

export const PersonalInfoScreen: React.FC = () => {
  const { profile, setProfileField } = usePreferencesStore();
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Personal Info</Text>
        <Text className="text-gray-500 mt-1">Update your details</Text>
      </View>

      <View className="px-4 py-6">
        <Text className="text-sm text-gray-500 mb-2">Full Name</Text>
        <TextInput
          value={profile.fullName}
          onChangeText={(value) => setProfileField('fullName', value)}
          placeholder="Enter your name"
          className="border border-gray-200 rounded-xl px-4 py-3 text-secondary"
        />

        <Text className="text-sm text-gray-500 mt-5 mb-2">Email</Text>
        <TextInput
          value={profile.email}
          onChangeText={(value) => setProfileField('email', value)}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-gray-200 rounded-xl px-4 py-3 text-secondary"
        />

        <Text className="text-sm text-gray-500 mt-5 mb-2">Phone</Text>
        <TextInput
          value={user?.phone || ''}
          editable={false}
          className="border border-gray-200 rounded-xl px-4 py-3 text-gray-400"
        />

        <Text className="text-sm text-gray-500 mt-5 mb-2">Emergency Contact</Text>
        <TextInput
          value={profile.emergencyContact}
          onChangeText={(value) => setProfileField('emergencyContact', value)}
          placeholder="Emergency contact number"
          keyboardType="phone-pad"
          className="border border-gray-200 rounded-xl px-4 py-3 text-secondary"
        />
      </View>
    </SafeAreaView>
  );
};

export default PersonalInfoScreen;
