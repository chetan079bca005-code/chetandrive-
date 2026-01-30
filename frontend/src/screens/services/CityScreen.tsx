import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin, Check, Search } from 'lucide-react-native';
import { Colors } from '../../config/colors';

const cities = [
  { id: 'ktm', name: 'Kathmandu', isAvailable: true },
  { id: 'ptn', name: 'Patan', isAvailable: true },
  { id: 'bkt', name: 'Bhaktapur', isAvailable: true },
  { id: 'pkr', name: 'Pokhara', isAvailable: true },
  { id: 'brt', name: 'Bharatpur', isAvailable: false },
  { id: 'brgj', name: 'Birgunj', isAvailable: false },
  { id: 'dhr', name: 'Dharan', isAvailable: false },
  { id: 'btl', name: 'Butwal', isAvailable: false },
];

export const CityScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedCity, setSelectedCity] = useState('ktm');

  const handleSelectCity = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    if (city?.isAvailable) {
      setSelectedCity(cityId);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-secondary ml-2">Select City</Text>
      </View>

      <View className="px-4 py-3 bg-gray-50">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
          <Search size={20} color={Colors.gray400} />
          <Text className="text-gray-400 ml-2">Search city...</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        <Text className="text-sm font-medium text-gray-500 mb-3">Available Cities</Text>
        
        {cities.filter(c => c.isAvailable).map((city) => (
          <TouchableOpacity
            key={city.id}
            onPress={() => handleSelectCity(city.id)}
            className={`flex-row items-center px-4 py-4 rounded-xl mb-2 ${
              selectedCity === city.id ? 'bg-primary/10 border border-primary' : 'bg-gray-50'
            }`}
          >
            <MapPin size={20} color={selectedCity === city.id ? Colors.primary : Colors.gray500} />
            <Text className={`flex-1 ml-3 text-base ${
              selectedCity === city.id ? 'font-semibold text-secondary' : 'text-gray-700'
            }`}>
              {city.name}
            </Text>
            {selectedCity === city.id && (
              <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                <Check size={14} color={Colors.secondary} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        <Text className="text-sm font-medium text-gray-500 mt-6 mb-3">Coming Soon</Text>
        
        {cities.filter(c => !c.isAvailable).map((city) => (
          <View
            key={city.id}
            className="flex-row items-center px-4 py-4 rounded-xl mb-2 bg-gray-50 opacity-50"
          >
            <MapPin size={20} color={Colors.gray400} />
            <Text className="flex-1 ml-3 text-base text-gray-400">{city.name}</Text>
            <View className="bg-gray-200 px-2 py-1 rounded">
              <Text className="text-xs text-gray-500">Soon</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="px-4 pb-6 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-primary py-4 rounded-2xl items-center"
        >
          <Text className="text-base font-semibold text-secondary">Confirm City</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CityScreen;
