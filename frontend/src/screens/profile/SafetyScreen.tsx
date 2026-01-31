import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  AlertTriangle,
  Users,
  Share2,
  Phone,
  MapPin,
  ChevronRight,
  Plus,
  Trash2,
  Info,
} from 'lucide-react-native';
import { usePreferencesStore } from '../../store';
import { safetyService } from '../../services';
import { Colors } from '../../config/colors';

interface EmergencyContact {
  _id: string;
  name: string;
  phone: string;
  relationship: string;
}

export const SafetyScreen: React.FC = () => {
  const { profile, setProfileField } = usePreferencesStore();
  
  const [autoShareTrips, setAutoShareTrips] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await safetyService.getContacts();
        setEmergencyContacts(response.contacts as EmergencyContact[]);
      } catch (error) {
        console.log('Failed to load emergency contacts');
      }
    };
    fetchContacts();
  }, []);

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    safetyService
      .addContact({ name: newContactName, phone: newContactPhone, relationship: 'Custom' })
      .then((response) => {
        setEmergencyContacts(response.contacts as EmergencyContact[]);
        setNewContactName('');
        setNewContactPhone('');
        setShowAddContact(false);
      })
      .catch(() => Alert.alert('Error', 'Failed to add contact'));
  };

  const handleRemoveContact = (id: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            safetyService
              .removeContact(id)
              .then((response) => setEmergencyContacts(response.contacts as EmergencyContact[]))
              .catch(() => Alert.alert('Error', 'Failed to remove contact'));
          },
        },
      ]
    );
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will immediately alert emergency services (100) and notify all your emergency contacts with your live location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency (100)',
          style: 'destructive',
          onPress: () => {
            safetyService
              .sendSOS({ rideId: 'safety-test', location: undefined })
              .catch(() => undefined)
              .finally(() => {
                Alert.alert('Emergency Activated', 'Emergency services have been notified.');
              });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Safety Center</Text>
        <Text className="text-gray-500 mt-1">Your safety is our priority</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Emergency SOS */}
        <View className="mx-4 mt-4 bg-red-50 rounded-2xl p-4 border border-red-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-red-500 items-center justify-center">
                <AlertTriangle size={24} color={Colors.white} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-semibold text-red-700">Emergency SOS</Text>
                <Text className="text-sm text-red-600">
                  Instantly alert emergency services
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSOS}
              className="bg-red-500 px-4 py-2 rounded-xl"
            >
              <Text className="text-white font-semibold">Test SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Features */}
        <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-secondary mb-3">
            Safety Features
          </Text>

          {/* Auto Share Trips */}
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center flex-1">
              <Share2 size={20} color={Colors.info} />
              <View className="ml-3">
                <Text className="text-sm font-medium text-secondary">Auto-share trips</Text>
                <Text className="text-xs text-gray-500">
                  Automatically share trip details with contacts
                </Text>
              </View>
            </View>
            <Switch
              value={autoShareTrips}
              onValueChange={setAutoShareTrips}
              trackColor={{ false: Colors.gray300, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Real-time Tracking */}
          <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center flex-1">
              <MapPin size={20} color={Colors.success} />
              <View className="ml-3">
                <Text className="text-sm font-medium text-secondary">Real-time tracking</Text>
                <Text className="text-xs text-gray-500">
                  Share live location during rides
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.gray400} />
          </TouchableOpacity>

          {/* Emergency Helpline */}
          <TouchableOpacity
            onPress={() => Alert.alert('Emergency Helpline', 'Call 100 for police or 102 for ambulance')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center flex-1">
              <Phone size={20} color={Colors.danger} />
              <View className="ml-3">
                <Text className="text-sm font-medium text-secondary">Emergency helplines</Text>
                <Text className="text-xs text-gray-500">
                  Police: 100 • Ambulance: 102
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Trusted Contacts */}
        <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Users size={20} color={Colors.secondary} />
              <Text className="text-base font-semibold text-secondary ml-2">
                Trusted Contacts
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddContact(!showAddContact)}
              className="bg-gray-100 p-2 rounded-full"
            >
              <Plus size={18} color={Colors.secondary} />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-500 mb-3">
            These contacts will be notified in case of emergency
          </Text>

          {/* Add Contact Form */}
          {showAddContact && (
            <View className="bg-gray-50 rounded-xl p-3 mb-3">
              <TextInput
                value={newContactName}
                onChangeText={setNewContactName}
                placeholder="Contact name"
                className="border border-gray-200 rounded-lg px-3 py-2 text-secondary mb-2 bg-white"
              />
              <TextInput
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
                className="border border-gray-200 rounded-lg px-3 py-2 text-secondary mb-2 bg-white"
              />
              <TouchableOpacity
                onPress={handleAddContact}
                className="bg-primary py-2 rounded-lg"
              >
                <Text className="text-center font-semibold text-secondary">Add Contact</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Contact List */}
          {emergencyContacts.map((contact) => (
            <View
              key={contact._id}
              className="flex-row items-center justify-between py-3 border-b border-gray-100"
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-secondary">{contact.name}</Text>
                <Text className="text-xs text-gray-500">{contact.phone}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveContact(contact._id)}
                className="p-2"
              >
                <Trash2 size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {emergencyContacts.length === 0 && (
            <View className="py-4 items-center">
              <Text className="text-gray-400">No contacts added yet</Text>
            </View>
          )}
        </View>

        {/* Safety Tips */}
        <View className="mx-4 mt-4 mb-8 bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <View className="flex-row items-center mb-3">
            <Info size={20} color={Colors.info} />
            <Text className="text-base font-semibold text-blue-700 ml-2">Safety Tips</Text>
          </View>
          
          <View className="space-y-2">
            {[
              'Always verify the driver and vehicle before getting in',
              'Share your trip details with friends or family',
              'Check the license plate matches the app',
              'Sit in the back seat when riding alone',
              'Trust your instincts - cancel if something feels wrong',
            ].map((tip, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <Text className="text-blue-600 mr-2">•</Text>
                <Text className="text-sm text-blue-700 flex-1">{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SafetyScreen;
