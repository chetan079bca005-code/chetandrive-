import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../config/colors';
import { supportService } from '../../services';
import { useRideStore } from '../../store';

export const HelpCenterScreen: React.FC = () => {
  const { currentRide } = useRideStore();
  const [category, setCategory] = useState<'late_arrival' | 'unsafe_driving' | 'fare_dispute' | 'app_issue' | 'other'>('other');
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState<{ _id: string; category: string; status: string; description: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supportService
      .getMyTickets()
      .then((response) => setTickets(response.tickets))
      .catch(() => undefined);
  }, []);

  const submitTicket = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await supportService.createTicket({
        rideId: currentRide?._id,
        category,
        description,
      });
      setTickets((prev) => [response.ticket, ...prev]);
      setDescription('');
      Alert.alert('Submitted', 'Your report has been sent to support.');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Help Center</Text>
        <Text className="text-gray-500 mt-1">FAQs and support</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <Text className="text-base font-medium text-secondary mb-2">Common questions</Text>
          <Text className="text-sm text-gray-600 mb-4">
            • How to book a ride?
            {'\n'}• How to cancel a ride?
            {'\n'}• How to contact support?
          </Text>

          <Text className="text-base font-medium text-secondary mb-2">Report an issue</Text>
          <View className="bg-gray-50 rounded-2xl p-4">
            <Text className="text-xs text-gray-500 mb-2">Category</Text>
            <View className="flex-row flex-wrap">
              {[
                { id: 'late_arrival', label: 'Late arrival' },
                { id: 'unsafe_driving', label: 'Unsafe driving' },
                { id: 'fare_dispute', label: 'Fare dispute' },
                { id: 'app_issue', label: 'App issue' },
                { id: 'other', label: 'Other' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setCategory(item.id as any)}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                    category === item.id ? 'bg-primary' : 'bg-white'
                  }`}
                >
                  <Text className={`text-xs ${category === item.id ? 'text-secondary' : 'text-gray-600'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-xs text-gray-500 mt-2">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue"
              multiline
              numberOfLines={4}
              className="mt-2 bg-white rounded-xl p-3 text-secondary"
              placeholderTextColor={Colors.gray400}
            />

            <TouchableOpacity
              onPress={submitTicket}
              disabled={isSubmitting}
              className={`mt-3 py-3 rounded-xl items-center ${isSubmitting ? 'bg-gray-200' : 'bg-primary'}`}
            >
              <Text className="text-sm font-semibold text-secondary">Submit Report</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-base font-medium text-secondary mt-6 mb-2">Your reports</Text>
          {tickets.length === 0 ? (
            <Text className="text-sm text-gray-500">No reports yet.</Text>
          ) : (
            tickets.map((ticket) => (
              <View key={ticket._id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2">
                <Text className="text-xs text-gray-400">{ticket.category.replace('_', ' ')}</Text>
                <Text className="text-sm text-secondary mt-1" numberOfLines={2}>{ticket.description}</Text>
                <Text className="text-xs text-gray-500 mt-1">Status: {ticket.status}</Text>
              </View>
            ))
          )}

          <Text className="text-base font-medium text-secondary mb-2 mt-6">Support</Text>
          <Text className="text-sm text-gray-600">Email: support@ridebook.local</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpCenterScreen;
