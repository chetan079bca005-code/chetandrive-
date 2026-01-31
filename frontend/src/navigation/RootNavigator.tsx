import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store';
import { DrawerNavigator } from './DrawerNavigator';
import {
  SplashScreen,
  OnboardingScreen,
  LoginScreen,
  LocationSearchScreen,
  ChooseOnMapScreen,
  RideConfirmationScreen,
  RideTrackingScreen,
  DriverOffersScreen,
  ChatScreen,
  DriverProfileScreen,
  RideCompletionScreen,
  RequestsScreen,
  DriverRideScreen,
  NotificationsInboxScreen,
  NotificationsScreen,
  SettingsScreen,
  PersonalInfoScreen,
  SavedPlacesScreen,
  PaymentMethodsScreen,
  SafetyScreen,
  HelpCenterScreen,
  CityScreen,
  CouriersScreen,
  CityToCityScreen,
  FreightScreen,
} from '../screens';
import { DriverOffer, DriverProfile } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  MainDrawer: undefined;
  LocationSearch: { type: 'pickup' | 'drop'; serviceType?: 'city' | 'intercity' | 'delivery' | 'freight' };
  ChooseOnMap: { type: 'pickup' | 'drop' };
  RideConfirmation: { serviceType?: 'city' | 'intercity' | 'delivery' | 'freight' } | undefined;
  RideTracking: { rideId: string };
  DriverOffers: {
    rideId: string;
    proposedFare: number;
    distance: number;
    duration: number;
    routeCoordinates?: { latitude: number; longitude: number }[];
  };
  Chat: { offerId?: string; rideId?: string; driver: DriverProfile };
  DriverProfile: { offer: DriverOffer };
  RideCompletion: { rideId: string };
  Requests: undefined;
  DriverRide: { rideId: string };
  NotificationsInbox: undefined;
  Notifications: undefined;
  Settings: undefined;
  PersonalInfo: undefined;
  SavedPlaces: undefined;
  PaymentMethods: undefined;
  Safety: undefined;
  HelpCenter: undefined;
  City: undefined;
  Couriers: undefined;
  CityToCity: undefined;
  Freight: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isOnboarded } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
        initialRouteName="Splash"
      >
        {/* Auth Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Main App */}
        <Stack.Screen name="MainDrawer" component={DrawerNavigator} />

        {/* Settings & Profile Screens */}
        <Stack.Screen name="NotificationsInbox" component={NotificationsInboxScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="Safety" component={SafetyScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />

        {/* Ride Screens */}
        <Stack.Screen
          name="LocationSearch"
          component={LocationSearchScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="ChooseOnMap"
          component={ChooseOnMapScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="RideConfirmation" component={RideConfirmationScreen} />
        <Stack.Screen
          name="RideTracking"
          component={RideTrackingScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="DriverOffers"
          component={DriverOffersScreen}
          options={{
            animation: 'slide_from_bottom',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="DriverProfile"
          component={DriverProfileScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="RideCompletion"
          component={RideCompletionScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="Requests" component={RequestsScreen} />
        <Stack.Screen name="DriverRide" component={DriverRideScreen} />

        {/* Services Screens */}
        <Stack.Screen name="City" component={CityScreen} />
        <Stack.Screen name="Couriers" component={CouriersScreen} />
        <Stack.Screen name="CityToCity" component={CityToCityScreen} />
        <Stack.Screen name="Freight" component={FreightScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
