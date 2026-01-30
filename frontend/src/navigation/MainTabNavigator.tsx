import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, ActivityScreen, ProfileScreen } from '../screens';

export type MainTabParamList = {
  Home: undefined;
  Activity: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default MainTabNavigator;
