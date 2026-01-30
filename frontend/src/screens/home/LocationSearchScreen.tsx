import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import {
  ArrowLeft,
  Search,
  MapPin,
  Navigation,
  Clock,
  Star,
  X,
} from 'lucide-react-native';
import { useLocationStore } from '../../store';
import { galliMapsService, GalliAutocompleteResult } from '../../services';
import { Colors } from '../../config/colors';

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  type: 'recent' | 'saved' | 'search';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

type RouteParams = {
  LocationSearch: {
    type: 'pickup' | 'drop';
  };
};

// Sample saved/recent places (Kathmandu locations)
const savedPlaces: PlaceResult[] = [
  {
    id: '1',
    name: 'Home',
    address: 'Thamel, Kathmandu',
    type: 'saved',
    coordinates: { latitude: 27.7150, longitude: 85.3121 },
  },
  {
    id: '2',
    name: 'Work',
    address: 'Durbar Marg, Kathmandu',
    type: 'saved',
    coordinates: { latitude: 27.7139, longitude: 85.3200 },
  },
];

const recentPlaces: PlaceResult[] = [
  {
    id: '3',
    name: 'Tribhuvan Airport',
    address: 'Tribhuvan International Airport, Kathmandu',
    type: 'recent',
    coordinates: { latitude: 27.6966, longitude: 85.3591 },
  },
  {
    id: '4',
    name: 'City Center Mall',
    address: 'Kamaladi, Kathmandu',
    type: 'recent',
    coordinates: { latitude: 27.7056, longitude: 85.3159 },
  },
  {
    id: '5',
    name: 'Patan Durbar Square',
    address: 'Lalitpur, Nepal',
    type: 'recent',
    coordinates: { latitude: 27.6727, longitude: 85.3248 },
  },
];

export const LocationSearchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'LocationSearch'>>();
  const { type } = route.params;

  const { setPickupLocation, setDropLocation, currentLocation, pickupLocation } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isPickup = type === 'pickup';

  // Debounced search with Galli Maps
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use Galli Maps autocomplete
      const results = await galliMapsService.autocomplete(
        query,
        currentLocation?.latitude,
        currentLocation?.longitude
      );

      const formattedResults: PlaceResult[] = results.map((result, index) => ({
        id: `search-${index}-${result.placeId}`,
        name: result.name,
        address: result.address,
        type: 'search' as const,
        coordinates: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Galli Maps search error:', error);
      // Fallback to expo-location geocode
      try {
        const results = await Location.geocodeAsync(query);
        const formattedResults: PlaceResult[] = results.slice(0, 5).map((result, index) => ({
          id: `fallback-${index}`,
          name: query,
          address: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
          type: 'search' as const,
          coordinates: {
            latitude: result.latitude,
            longitude: result.longitude,
          },
        }));
        setSearchResults(formattedResults);
      } catch (fallbackError) {
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [currentLocation]);

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length > 1) {
        searchPlaces(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchPlaces]);

  const handleSelectPlace = async (place: PlaceResult) => {
    Keyboard.dismiss();

    let coordinates = place.coordinates;
    const address = place.name || place.address;

    // If no coordinates, try to get from Galli Maps reverse geocode
    if (!coordinates) {
      try {
        const results = await galliMapsService.autocomplete(place.address);
        if (results.length > 0) {
          coordinates = {
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          };
        }
      } catch (error) {
        console.error('Geocode error:', error);
      }
    }

    if (isPickup) {
      setPickupLocation(coordinates || null, address);
    } else {
      setDropLocation(coordinates || null, address);
    }

    // Navigate to ride confirmation if drop location is set
    if (!isPickup && coordinates) {
      navigation.navigate('RideConfirmation');
    } else {
      navigation.goBack();
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Use Galli Maps reverse geocode for accurate address
      let formattedAddress = 'Current Location';
      try {
        const galliResult = await galliMapsService.reverseGeocode(coords.latitude, coords.longitude);
        if (galliResult) {
          formattedAddress = galliResult.name || galliResult.address || 'Current Location';
        }
      } catch (error) {
        // Fallback to expo-location
        const [address] = await Location.reverseGeocodeAsync(coords);
        formattedAddress = address
          ? `${address.name || ''} ${address.street || ''}, ${address.city || ''}`.trim()
          : 'Current Location';
      }

      if (isPickup) {
        setPickupLocation(coords, formattedAddress);
      } else {
        setDropLocation(coords, formattedAddress);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const renderPlaceItem = ({ item }: { item: PlaceResult }) => (
    <TouchableOpacity
      onPress={() => handleSelectPlace(item)}
      className="flex-row items-center py-4 px-4 border-b border-gray-100"
      activeOpacity={0.7}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
          item.type === 'saved'
            ? 'bg-primary/10'
            : item.type === 'recent'
            ? 'bg-gray-100'
            : 'bg-danger/10'
        }`}
      >
        {item.type === 'saved' ? (
          <Star size={18} color={Colors.primary} />
        ) : item.type === 'recent' ? (
          <Clock size={18} color={Colors.gray500} />
        ) : (
          <MapPin size={18} color={Colors.danger} />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-secondary">{item.name}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Use Current Location */}
      {isPickup && (
        <TouchableOpacity
          onPress={handleUseCurrentLocation}
          className="flex-row items-center py-4 px-4 border-b border-gray-100"
          activeOpacity={0.7}
        >
          <View className="w-10 h-10 bg-success/10 rounded-full items-center justify-center mr-4">
            <Navigation size={18} color={Colors.success} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-secondary">
              Use current location
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              Using GPS
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Saved Places */}
      {!searchQuery && (
        <>
          <Text className="text-sm font-medium text-gray-500 px-4 pt-4 pb-2">
            SAVED PLACES
          </Text>
          {savedPlaces.map((place) => (
            <React.Fragment key={place.id}>
              {renderPlaceItem({ item: place })}
            </React.Fragment>
          ))}

          <Text className="text-sm font-medium text-gray-500 px-4 pt-6 pb-2">
            RECENT
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-secondary">Enter your route</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center"
        >
          <X size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Route Input */}
      <View className="px-4 py-3">
        {!isPickup && (
          <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-success mr-3" />
              <Text className="text-sm text-gray-500">Pickup point</Text>
            </View>
            <Text className="text-base font-semibold text-secondary mt-1" numberOfLines={1}>
              {pickupLocation.address || 'Set pickup point'}
            </Text>
          </View>
        )}

        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4">
          <Search size={20} color={Colors.gray500} />
          <TextInput
            className="flex-1 py-4 px-3 text-base text-secondary"
            placeholder={isPickup ? 'Pickup point' : 'To'}
            placeholderTextColor={Colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={Colors.gray500} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          className="flex-row items-center mt-3"
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ChooseOnMap', { type: isPickup ? 'pickup' : 'drop' })}
        >
          <Text className="text-xl mr-2">🗺️</Text>
          <Text className="text-base text-primary">Choose on map</Text>
        </TouchableOpacity>
      </View>

      {/* Results List */}
      <FlatList
        data={searchQuery ? searchResults : recentPlaces}
        keyExtractor={(item: PlaceResult) => item.id}
        renderItem={renderPlaceItem}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

export default LocationSearchScreen;
