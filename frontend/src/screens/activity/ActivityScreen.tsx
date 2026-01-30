import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Menu,
  Bell,
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react-native';
import { rideService } from '../../services';
import { Ride } from '../../types';
import { Colors } from '../../config/colors';

const statusConfig = {
  SEARCHING_FOR_RIDER: {
    label: 'Searching',
    color: Colors.warning,
    icon: Clock,
  },
  START: {
    label: 'In Progress',
    color: Colors.info,
    icon: Navigation,
  },
  ARRIVED: {
    label: 'Arrived',
    color: Colors.success,
    icon: MapPin,
  },
  COMPLETED: {
    label: 'Completed',
    color: Colors.success,
    icon: CheckCircle,
  },
};

const vehicleEmojis = {
  bike: '🏍️',
  auto: '🛺',
  cabEconomy: '🚗',
  cabPremium: '🚙',
};

export const ActivityScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const response = await rideService.getMyRides();
      setRides(response.rides);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRides();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NP', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRideItem = ({ item }: { item: Ride }) => {
    const status = statusConfig[item.status];
    const StatusIcon = status.icon;

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
        activeOpacity={0.7}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">
              {vehicleEmojis[item.vehicle]}
            </Text>
            <View>
              <Text className="text-base font-semibold text-secondary capitalize">
                {item.vehicle.replace('cab', 'Cab ')}
              </Text>
              <Text className="text-xs text-gray-500">
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <View
            className="flex-row items-center px-3 py-1 rounded-full"
            style={{ backgroundColor: `${status.color}20` }}
          >
            <StatusIcon size={14} color={status.color} />
            <Text
              className="text-sm font-medium ml-1"
              style={{ color: status.color }}
            >
              {status.label}
            </Text>
          </View>
        </View>

        {/* Route */}
        <View className="bg-gray-50 rounded-xl p-3 mb-3">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-success/10 items-center justify-center mr-3">
              <Navigation size={12} color={Colors.success} />
            </View>
            <Text className="flex-1 text-sm text-secondary" numberOfLines={1}>
              {item.pickup.address}
            </Text>
          </View>
          <View className="ml-3 w-0.5 h-3 bg-gray-300 mb-2" />
          <View className="flex-row items-center">
            <View className="w-6 h-6 rounded-full bg-danger/10 items-center justify-center mr-3">
              <MapPin size={12} color={Colors.danger} />
            </View>
            <Text className="flex-1 text-sm text-secondary" numberOfLines={1}>
              {item.drop.address}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-lg font-bold text-secondary">रु {Math.round(item.fare)}</Text>
            <Text className="text-sm text-gray-500 ml-2">
              • {item.distance} km
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.gray400} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-6xl mb-4">🚗</Text>
      <Text className="text-xl font-semibold text-secondary mb-2">
        No rides yet
      </Text>
      <Text className="text-gray-500 text-center px-8">
        Your ride history will appear here once you book your first ride
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray50} />

      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="w-12 h-12 bg-white rounded-full items-center justify-center"
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Menu size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-secondary">Your Rides</Text>
          <TouchableOpacity
            className="w-12 h-12 bg-white rounded-full items-center justify-center"
            onPress={() => navigation.navigate('NotificationsInbox')}
          >
            <Bell size={22} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 mt-1">
          {rides.length} {rides.length === 1 ? 'ride' : 'rides'} total
        </Text>
      </View>

      {/* Rides List */}
      <FlatList
        data={rides}
        keyExtractor={(item: Ride) => item._id}
        renderItem={renderRideItem}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

export default ActivityScreen;
