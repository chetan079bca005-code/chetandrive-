import React from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import {
  MapPin,
  Clock,
  Package,
  Globe,
  Truck,
  Bell,
  Shield,
  Settings,
  HelpCircle,
  MessageCircle,
  LogOut,
  User,
} from 'lucide-react-native';
import { MainTabNavigator } from './MainTabNavigator';
import { Colors } from '../config/colors';
import { useAuthStore } from '../store';

type DrawerParamList = {
  MainTabs: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: string;
}> = ({ icon, label, onPress, badge }) => (
  <TouchableOpacity
    className="flex-row items-center py-3 px-2"
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View className="w-8 items-center">{icon}</View>
    <Text className="text-base text-secondary flex-1 ml-3">{label}</Text>
    {badge ? (
      <View className="bg-danger rounded-full min-w-[22px] px-2 py-0.5 items-center">
        <Text className="text-xs text-white font-semibold">{badge}</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const CustomDrawerContent: React.FC<any> = (props) => {
  const { logout, user } = useAuthStore();
  const navigation = props.navigation;
  const rootNavigation = useNavigation<any>();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableOpacity
        className="px-5 py-6 bg-white"
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
      >
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mr-3">
            <User size={28} color={Colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-secondary">
              {user?.phone || 'Chetan'}
            </Text>
            <Text className="text-sm text-gray-500">View profile</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View className="px-4 py-2">
        <DrawerRow
          icon={<MapPin size={20} color={Colors.gray700} />}
          label="City"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('City');
          }}
        />
        <DrawerRow
          icon={<Clock size={20} color={Colors.gray700} />}
          label="Request history"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Activity' })}
        />
        <DrawerRow
          icon={<Package size={20} color={Colors.gray700} />}
          label="Couriers"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('Couriers');
          }}
        />
        <DrawerRow
          icon={<Globe size={20} color={Colors.gray700} />}
          label="City to City"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('CityToCity');
          }}
        />
        <DrawerRow
          icon={<Truck size={20} color={Colors.gray700} />}
          label="Freight"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('Freight');
          }}
        />
        <DrawerRow
          icon={<Bell size={20} color={Colors.gray700} />}
          label="Notifications"
          badge="1"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('NotificationsInbox');
          }}
        />
        <DrawerRow
          icon={<Shield size={20} color={Colors.gray700} />}
          label="Safety"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('Safety');
          }}
        />
        <DrawerRow
          icon={<Settings size={20} color={Colors.gray700} />}
          label="Settings"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('Settings');
          }}
        />
        <DrawerRow
          icon={<HelpCircle size={20} color={Colors.gray700} />}
          label="Help"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('HelpCenter');
          }}
        />
        <DrawerRow
          icon={<MessageCircle size={20} color={Colors.gray700} />}
          label="Support"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('HelpCenter');
          }}
        />
      </View>

      <View className="px-4 mt-auto pb-4">
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
        >
          <Text className="text-base font-semibold text-secondary">Driver mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-center mt-4"
          onPress={() => {
            logout();
            rootNavigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
        >
          <LogOut size={18} color={Colors.danger} />
          <Text className="text-sm font-medium text-danger ml-2">Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

export const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.gray600,
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
