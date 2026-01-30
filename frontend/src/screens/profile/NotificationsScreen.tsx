import React from 'react';
import { View, Text, Switch, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferencesStore } from '../../store';
import { Colors } from '../../config/colors';

const NotificationRow: React.FC<{
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}> = ({ label, value, onChange, description }) => (
  <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
    <View className="flex-1 pr-4">
      <Text className="text-base font-medium text-secondary">{label}</Text>
      {description ? (
        <Text className="text-sm text-gray-500 mt-1">{description}</Text>
      ) : null}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: Colors.gray300, true: Colors.primary }}
      thumbColor={Colors.white}
    />
  </View>
);

export const NotificationsScreen: React.FC = () => {
  const { notifications, setNotification } = usePreferencesStore();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Notifications</Text>
        <Text className="text-gray-500 mt-1">Manage your alerts and updates</Text>
      </View>

      <View>
        <NotificationRow
          label="Ride updates"
          description="Status changes, driver assigned, arrival"
          value={notifications.rideUpdates}
          onChange={(value) => setNotification('rideUpdates', value)}
        />
        <NotificationRow
          label="Promotions"
          description="Offers, discounts, and coupons"
          value={notifications.promotions}
          onChange={(value) => setNotification('promotions', value)}
        />
        <NotificationRow
          label="SMS alerts"
          description="Important ride notifications via SMS"
          value={notifications.sms}
          onChange={(value) => setNotification('sms', value)}
        />
        <NotificationRow
          label="Email updates"
          description="Receipts and account updates"
          value={notifications.email}
          onChange={(value) => setNotification('email', value)}
        />
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
