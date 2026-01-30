import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, User, MapPin, CreditCard, Shield, HelpCircle, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../config/colors';

const SettingsItem: React.FC<{
  title: string;
  subtitle?: string;
  onPress: () => void;
  icon: React.ReactNode;
}> = ({ title, subtitle, onPress, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-4 py-4 border-b border-gray-100"
    activeOpacity={0.7}
  >
    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1">
      <Text className="text-base font-medium text-secondary">{title}</Text>
      {subtitle ? <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text> : null}
    </View>
    <ChevronRight size={20} color={Colors.gray400} />
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Settings</Text>
        <Text className="text-gray-500 mt-1">Manage your preferences</Text>
      </View>

      <SettingsItem
        title="Notifications"
        subtitle="Ride updates, promos, SMS"
        icon={<Bell size={20} color={Colors.secondary} />}
        onPress={() => navigation.navigate('Notifications')}
      />
      <SettingsItem
        title="Personal Info"
        subtitle="Name, email, emergency contact"
        icon={<User size={20} color={Colors.secondary} />}
        onPress={() => navigation.navigate('PersonalInfo')}
      />
      <SettingsItem
        title="Saved Places"
        subtitle="Home and work addresses"
        icon={<MapPin size={20} color={Colors.secondary} />}
        onPress={() => navigation.navigate('SavedPlaces')}
      />
      <SettingsItem
        title="Payment Methods"
        subtitle="Cash, eSewa, Khalti"
        icon={<CreditCard size={20} color={Colors.secondary} />}
        onPress={() => navigation.navigate('PaymentMethods')}
      />
      <SettingsItem
        title="Safety"
        subtitle="Emergency contact, trip sharing"
        icon={<Shield size={20} color={Colors.secondary} />}
        onPress={() => navigation.navigate('Safety')}
      />
      <SettingsItem
        title="Help Center"
        subtitle="FAQs and support"
        icon={<HelpCircle size={20} color={Colors.secondary} />}
        onPress={() => navigation.navigate('HelpCenter')}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;
