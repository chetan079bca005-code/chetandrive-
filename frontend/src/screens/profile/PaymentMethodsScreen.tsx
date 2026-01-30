import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, CheckCircle } from 'lucide-react-native';
import { Colors } from '../../config/colors';

const methods = [
  { id: 'cash', label: 'Cash' },
  { id: 'esewa', label: 'eSewa' },
  { id: 'khalti', label: 'Khalti' },
];

export const PaymentMethodsScreen: React.FC = () => {
  const [defaultMethod, setDefaultMethod] = useState('cash');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-secondary">Payment Methods</Text>
        <Text className="text-gray-500 mt-1">Choose your default payment</Text>
      </View>

      <View className="px-4 py-4">
        {methods.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => setDefaultMethod(method.id)}
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4">
                <CreditCard size={20} color={Colors.secondary} />
              </View>
              <Text className="text-base font-medium text-secondary">{method.label}</Text>
            </View>
            {defaultMethod === method.id && (
              <CheckCircle size={20} color={Colors.success} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;
