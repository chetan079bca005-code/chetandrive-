import React from 'react';
import { View, Text, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferencesStore } from '../../store';
import { Colors } from '../../config/colors';

export const SavedPlacesScreen: React.FC = () => {
  const { savedPlaces, setSavedPlace } = usePreferencesStore();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Saved Places</Text>
        <Text className="text-gray-500 mt-1">Set your home and work</Text>
      </View>

      <View className="px-4 py-6">
        <Text className="text-sm text-gray-500 mb-2">Home</Text>
        <TextInput
          value={savedPlaces.home}
          onChangeText={(value) => setSavedPlace('home', value)}
          placeholder="Add home address"
          className="border border-gray-200 rounded-xl px-4 py-3 text-secondary"
        />

        <Text className="text-sm text-gray-500 mt-5 mb-2">Work</Text>
        <TextInput
          value={savedPlaces.work}
          onChangeText={(value) => setSavedPlace('work', value)}
          placeholder="Add work address"
          className="border border-gray-200 rounded-xl px-4 py-3 text-secondary"
        />
      </View>
    </SafeAreaView>
  );
};

export default SavedPlacesScreen;
