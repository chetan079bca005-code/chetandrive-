import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../config/colors';

export const HelpCenterScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Help Center</Text>
        <Text className="text-gray-500 mt-1">FAQs and support</Text>
      </View>

      <View className="px-4 py-6">
        <Text className="text-base font-medium text-secondary mb-2">Common questions</Text>
        <Text className="text-sm text-gray-600 mb-4">
          • How to book a ride?
          {'\n'}• How to cancel a ride?
          {'\n'}• How to contact support?
        </Text>

        <Text className="text-base font-medium text-secondary mb-2">Support</Text>
        <Text className="text-sm text-gray-600">Email: support@ridebook.local</Text>
      </View>
    </SafeAreaView>
  );
};

export default HelpCenterScreen;
