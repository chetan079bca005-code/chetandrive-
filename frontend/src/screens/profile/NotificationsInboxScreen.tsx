import React from 'react';
import { View, Text, StatusBar, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CheckCircle, MapPin } from 'lucide-react-native';
import { Colors } from '../../config/colors';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: React.ReactNode;
};

const data: NotificationItem[] = [
  {
    id: '1',
    title: 'Ride completed',
    message: 'Thanks for riding with ChetanDrive.',
    time: 'Just now',
    icon: <CheckCircle size={18} color={Colors.success} />,
  },
  {
    id: '2',
    title: 'Driver nearby',
    message: 'Your driver is 3 minutes away.',
    time: '10 min ago',
    icon: <MapPin size={18} color={Colors.primary} />,
  },
  {
    id: '3',
    title: 'Safety reminder',
    message: 'Share your trip with family and friends.',
    time: 'Today',
    icon: <Bell size={18} color={Colors.secondary} />,
  },
];

export const NotificationsInboxScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Notifications</Text>
        <Text className="text-gray-500 mt-1">Latest updates from ChetanDrive</Text>
      </View>

      <FlatList<NotificationItem>
        data={data}
        keyExtractor={(item: NotificationItem) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }: { item: NotificationItem }) => (
          <View className="flex-row items-start bg-gray-50 rounded-2xl p-4 mb-3">
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
              {item.icon}
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-secondary">{item.title}</Text>
              <Text className="text-sm text-gray-600 mt-1">{item.message}</Text>
              <Text className="text-xs text-gray-400 mt-2">{item.time}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default NotificationsInboxScreen;
