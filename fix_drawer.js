const fs = require('fs');
const content = import React from 'react';
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
  LogOut,
  User,
  Repeat,
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
  const { logout, user, activeRole, setActiveRole } = useAuthStore();
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
              {user?.name || user?.phone || 'User'}
            </Text>
            <Text className="text-sm text-gray-500">View profile</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View className="px-4 py-2">
        {activeRole === 'customer' ? (
          <>
            <DrawerRow
              icon={<MapPin size={20} color={Colors.gray700} />}
              label="City Rides"
              onPress={() => {
                navigation.closeDrawer();
                rootNavigation.navigate('City');
              }}
            />
            <DrawerRow
              icon={<Clock size={20} color={Colors.gray700} />}
              label="Ride History"
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
              label="Intercity"
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
              icon={<Shield size={20} color={Colors.gray700} />}
              label="Safety"
              onPress={() => {
                navigation.closeDrawer();
                rootNavigation.navigate('Safety');
              }}
            />
          </>
        ) : (
          <>
            <DrawerRow
              icon={<MapPin size={20} color={Colors.gray700} />}
              label="Drive Now (City)"
              onPress={() => {
                navigation.closeDrawer();
                navigation.navigate('MainTabs', { screen: 'Home' });
              }}
            />
            <DrawerRow
              icon={<Clock size={20} color={Colors.gray700} />}
              label="Earnings & History"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Activity' })}
            />
            <DrawerRow
              icon={<Truck size={20} color={Colors.gray700} />}
              label="My Vehicle Info"
              onPress={() => {
                navigation.closeDrawer();
                rootNavigation.navigate('PersonalInfo'); // or whichever screen
              }}
            />
          </>
        )}

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
          icon={<Settings size={20} color={Colors.gray700} />}
          label="Settings"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('Settings');
          }}
        />
        <DrawerRow
          icon={<HelpCircle size={20} color={Colors.gray700} />}
          label="Help & Support"
          onPress={() => {
            navigation.closeDrawer();
            rootNavigation.navigate('HelpCenter');
          }}
        />
      </View>

      <View className="px-4 mt-auto pb-4">
        {user?.driverStatus === 'verified' ? (
          <TouchableOpacity
            className="flex-row rounded-2xl py-4 items-center justify-center mb-4 bg-gray-100"
            activeOpacity={0.8}
            onPress={() => {
              setActiveRole(activeRole === 'customer' ? 'rider' : 'customer');
              navigation.closeDrawer();
            }}
          >
            <Repeat size={20} color={Colors.secondary} />
            <Text className="text-base font-semibold text-secondary ml-2">
              Switch to {activeRole === 'customer' ? 'Driver' : 'Rider'}
            </Text>
          </TouchableOpacity>
        ) : activeRole === 'customer' ? (
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center mb-4 flex-row justify-center"
            activeOpacity={0.8}
            onPress={() => {
              if(user?.driverStatus === 'unverified') {
                 navigation.closeDrawer();
                 rootNavigation.navigate('DriverRegistration'); // ensure this route is available
              } else {
                 Alert.alert('Application Status', \Your driver application is currently \\);
              }
            }}
          >
            <Text className="text-base font-semibold text-secondary">Become a driver</Text>
          </TouchableOpacity>
        ) : null}

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
\;
fs.writeFileSync('d:/Ride_Booking_App/frontend/src/navigation/DrawerNavigator.tsx', content);
console.log('Drawer updated.');
