import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Menu,
  User,
  Phone,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  Star,
  Gift,
  ChevronRight,
  LogOut,
  Settings,
  Briefcase,
  Wallet,
} from 'lucide-react-native';
import { useAuthStore } from '../../store';
import { Colors } from '../../config/colors';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeText?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showBadge,
  badgeText,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center py-4 px-4"
    activeOpacity={0.7}
  >
    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1">
      <Text className="text-base font-medium text-secondary">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
      )}
    </View>
    {showBadge && badgeText && (
      <View className="bg-primary px-2 py-1 rounded-full mr-2">
        <Text className="text-xs font-medium text-secondary">{badgeText}</Text>
      </View>
    )}
    <ChevronRight size={20} color={Colors.gray400} />
  </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, logout } = useAuthStore();
  const isRider = user?.role === 'rider';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray50} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white px-4 py-6 mb-2">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Menu size={22} color={Colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => navigation.navigate('Settings')}
            >
              <Settings size={20} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="flex-row items-center"
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PersonalInfo')}
          >
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mr-4">
              <User size={40} color={Colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-secondary">
                {user?.phone || 'User'}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="flex-row items-center bg-primary/10 px-2 py-1 rounded-full">
                  <Star size={12} color={Colors.primary} fill={Colors.primary} />
                  <Text className="text-sm font-medium text-secondary ml-1">4.9</Text>
                </View>
                <Text className="text-sm text-gray-500 ml-2 capitalize">
                  {user?.role || 'Customer'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Rewards Section */}
        <View className="bg-white px-4 py-4 mb-2">
          <TouchableOpacity
            className="flex-row items-center bg-primary/10 rounded-2xl p-4"
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Activity')}
          >
            <View className="w-12 h-12 bg-primary rounded-full items-center justify-center mr-4">
              <Gift size={24} color={Colors.secondary} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-secondary">
                ChetanDrive Rewards
              </Text>
              <Text className="text-sm text-gray-600">
                150 points • Get 10% off your next ride
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View className="bg-white mb-2">
          <Text className="text-sm font-medium text-gray-500 px-4 pt-4 pb-2">
            ACCOUNT
          </Text>
          <MenuItem
            icon={<User size={20} color={Colors.gray600} />}
            title="Personal Info"
            subtitle="Name, email, phone"
            onPress={() => navigation.navigate('PersonalInfo')}
          />
          <MenuItem
            icon={<MapPin size={20} color={Colors.gray600} />}
            title="Saved Places"
            subtitle="Home, Work, and more"
            onPress={() => navigation.navigate('SavedPlaces')}
          />
          <MenuItem
            icon={<CreditCard size={20} color={Colors.gray600} />}
            title="Payment Methods"
            subtitle="Cash, eSewa, Khalti"
            onPress={() => navigation.navigate('PaymentMethods')}
          />
        </View>

        {isRider && (
          <View className="bg-white mb-2">
            <Text className="text-sm font-medium text-gray-500 px-4 pt-4 pb-2">
              RIDER TOOLS
            </Text>
            <MenuItem
              icon={<Briefcase size={20} color={Colors.gray600} />}
              title="Ride Requests"
              subtitle="View and manage requests"
              onPress={() => navigation.navigate('Requests')}
            />
            <MenuItem
              icon={<Wallet size={20} color={Colors.gray600} />}
              title="Earnings"
              subtitle="Weekly summary"
              onPress={() => Alert.alert('Earnings', 'Earnings summary will appear here.')}
            />
          </View>
        )}

        {/* Preferences Section */}
        <View className="bg-white mb-2">
          <Text className="text-sm font-medium text-gray-500 px-4 pt-4 pb-2">
            PREFERENCES
          </Text>
          <MenuItem
            icon={<Bell size={20} color={Colors.gray600} />}
            title="Notifications"
            subtitle="Customize alerts"
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuItem
            icon={<Shield size={20} color={Colors.gray600} />}
            title="Safety"
            subtitle="Emergency contacts, trip sharing"
            onPress={() => navigation.navigate('Safety')}
          />
        </View>

        {/* Support Section */}
        <View className="bg-white mb-2">
          <Text className="text-sm font-medium text-gray-500 px-4 pt-4 pb-2">
            SUPPORT
          </Text>
          <MenuItem
            icon={<HelpCircle size={20} color={Colors.gray600} />}
            title="Help Center"
            subtitle="FAQs and support"
            onPress={() => navigation.navigate('HelpCenter')}
          />
          <MenuItem
            icon={<Star size={20} color={Colors.gray600} />}
            title="Rate the App"
            onPress={() => Alert.alert('Thank you!', 'We appreciate your feedback.')}
          />
        </View>

        {/* Logout */}
        <View className="bg-white mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center py-4 px-4"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 bg-danger/10 rounded-full items-center justify-center mr-4">
              <LogOut size={20} color={Colors.danger} />
            </View>
            <Text className="text-base font-medium text-danger">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center pb-8">
          <Text className="text-sm text-gray-400">ChetanDrive v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
