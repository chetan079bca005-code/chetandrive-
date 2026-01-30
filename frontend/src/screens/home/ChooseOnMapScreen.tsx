import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { ArrowLeft, Check, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useLocationStore } from '../../store';
import { galliMapsService } from '../../services';
import { Colors } from '../../config/colors';
import { MAP_CONFIG } from '../../config/constants';
import { OSMMap, OSMMarker } from '../../components/ui';

type RouteParams = {
  ChooseOnMap: {
    type: 'pickup' | 'drop';
  };
};

export const ChooseOnMapScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'ChooseOnMap'>>();
  const { type } = route.params;
  const isPickup = type === 'pickup';

  const { currentLocation, setPickupLocation, setDropLocation } = useLocationStore();

  const [selectedCoords, setSelectedCoords] = useState(() =>
    currentLocation || {
      latitude: MAP_CONFIG.DEFAULT_LATITUDE,
      longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
    }
  );
  const [selectedAddress, setSelectedAddress] = useState('');

  const marker: OSMMarker = useMemo(
    () => ({
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,
      emoji: '📍',
      emojiSize: 24,
    }),
    [selectedCoords]
  );

  const handleMapPress = (coords: { latitude: number; longitude: number }) => {
    setSelectedCoords(coords);
    setSelectedAddress('');
  };

  const handleMapPressIOS = (event: MapPressEvent) => {
    const coords = event.nativeEvent.coordinate;
    handleMapPress(coords);
  };

  const resolveAddress = async () => {
    try {
      const galliResult = await galliMapsService.reverseGeocode(
        selectedCoords.latitude,
        selectedCoords.longitude
      );
      if (galliResult) {
        return galliResult.name || galliResult.address || 'Selected location';
      }
    } catch {
      // ignore
    }

    try {
      const [address] = await Location.reverseGeocodeAsync(selectedCoords);
      if (address) {
        return `${address.name || ''} ${address.street || ''}, ${address.city || ''}`.trim() || 'Selected location';
      }
    } catch {
      // ignore
    }

    return 'Selected location';
  };

  const handleConfirm = async () => {
    const address = selectedAddress || (await resolveAddress());
    if (isPickup) {
      setPickupLocation(selectedCoords, address);
      navigation.goBack();
    } else {
      setDropLocation(selectedCoords, address);
      navigation.navigate('RideConfirmation');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {Platform.OS === 'android' ? (
        <OSMMap
          center={selectedCoords}
          markers={[marker]}
          style={{ flex: 1 }}
          onPress={handleMapPress}
        />
      ) : (
        <MapView
          className="flex-1"
          initialRegion={{
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            latitudeDelta: MAP_CONFIG.LATITUDE_DELTA,
            longitudeDelta: MAP_CONFIG.LONGITUDE_DELTA,
          }}
          onPress={handleMapPressIOS}
        >
          <Marker coordinate={selectedCoords}>
            <View className="items-center">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center shadow-lg">
                <MapPin size={20} color={Colors.secondary} />
              </View>
            </View>
          </Marker>
        </MapView>
      )}

      <SafeAreaView className="absolute top-0 left-0 right-0">
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
          >
            <ArrowLeft size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <View className="bg-white rounded-full px-4 py-2 shadow-lg">
            <Text className="text-sm text-secondary font-medium">
              {isPickup ? 'Choose pickup point' : 'Choose drop point'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView className="absolute bottom-0 left-0 right-0">
        <View className="px-4 pb-4">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center"
            onPress={handleConfirm}
          >
            <Text className="text-base font-semibold text-secondary">
              Confirm location
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ChooseOnMapScreen;
