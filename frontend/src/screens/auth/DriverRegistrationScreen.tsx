import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera, CheckCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { Colors } from '../../config/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

type Step = 'welcome' | 'personal' | 'license' | 'vehicle' | 'status';

export const DriverRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, setUser } = useAuthStore();
  
  // Decide initial step based on status
  const getInitialStep = (): Step => {
    if (!user) return 'welcome';
    if (user.driverStatus === 'pending') return 'status';
    if (user.driverStatus === 'rejected') return 'status'; // Show why, let them restart
    return 'welcome';
  };

  const [step, setStep] = useState<Step>(getInitialStep());
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [personal, setPersonal] = useState({ name: user?.name || '', dob: '', photo: '' });
  const [license, setLicense] = useState({ number: '', expDate: '', photo: '' });
  const [vehicle, setVehicle] = useState({
    type: 'bike',
    make: '',
    model: '',
    color: '',
    licensePlate: '',
    year: '2020',
    capacity: '1',
    regPhoto: '',
  });

  const uploadMockImage = async (setter: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not select image.');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await authService.submitDriverInfo({
        name: personal.name,
        dob: personal.dob,
        driverPhoto: personal.photo,
        vehicleType: vehicle.type,
        licenseNumber: license.number,
        licensePhoto: license.photo,
        licenseExpDate: license.expDate,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate,
        year: parseInt(vehicle.year, 10),
        capacity: parseInt(vehicle.capacity, 10),
        registrationPhoto: vehicle.regPhoto,
      });

      setUser(response.user);
      setStep('status');
    } catch (error: any) {
      const err = error.response?.data?.message || 'Submission failed';
      Alert.alert('Error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatus = () => (
    <View className="flex-1 px-6 justify-center items-center">
      {user?.driverStatus === 'pending' ? (
        <>
          <View className="w-24 h-24 bg-warning/20 rounded-full items-center justify-center mb-6">
            <CheckCircle size={48} color={Colors.warning} />
          </View>
          <Text className="text-2xl font-bold text-secondary mb-4 text-center">
            Under Review
          </Text>
          <Text className="text-base text-gray-500 text-center mb-8">
            Your application is being reviewed by our team. This usually takes up to 24 hours. We'll notify you once you're approved!
          </Text>
          <Button
            title="Back to Customer Mode"
            onPress={() => navigation.replace('MainDrawer')}
            variant="outline"
            className="w-full"
          />
        </>
      ) : (
        <>
          <View className="w-24 h-24 bg-danger/20 rounded-full items-center justify-center mb-6">
            <CheckCircle size={48} color={Colors.danger} />
          </View>
          <Text className="text-2xl font-bold text-secondary mb-4 text-center">
            Action Required
          </Text>
          <Text className="text-base text-danger font-medium text-center mb-4">
            Reason: {user?.rejectionReason || 'Documents missing or invalid.'}
          </Text>
          <Text className="text-base text-gray-500 text-center mb-8">
            Please update your information and resubmit your application.
          </Text>
          <Button
            title="Start Over"
            onPress={() => setStep('personal')}
            className="w-full mb-4"
          />
          <Button
            title="Back to Home"
            onPress={() => navigation.replace('MainDrawer')}
            variant="outline"
            className="w-full"
          />
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {step !== 'welcome' && step !== 'status' && (
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
          <TouchableOpacity 
            onPress={() => {
              if (step === 'vehicle') setStep('license');
              else if (step === 'license') setStep('personal');
              else if (step === 'personal') setStep('welcome');
            }} 
            className="mr-3"
          >
            <ArrowLeft size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-secondary capitalize">{step} Info</Text>
        </View>
      )}

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {step === 'welcome' && (
          <View className="flex-1 py-10">
            <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-6">
              <Camera size={40} color={Colors.primary} />
            </View>
            <Text className="text-3xl font-bold text-secondary mb-4">
              Drive with Us
            </Text>
            <Text className="text-base text-gray-500 mb-8 leading-6">
              To join our community of drivers, you need to verify your identity and vehicle. This process guarantees safety for our riders and yourself.
            </Text>

            <View className="bg-gray-50 p-4 rounded-xl mb-10">
              <Text className="font-bold text-secondary mb-3">You will need:</Text>
              <Text className="text-gray-600 mb-2">• A clear profile photo</Text>
              <Text className="text-gray-600 mb-2">• Your Driving License</Text>
              <Text className="text-gray-600 mb-2">• Vehicle Registration (Bluebook)</Text>
            </View>

            <Button
              title="Start Application"
              onPress={() => setStep('personal')}
            />
          </View>
        )}

        {step === 'personal' && (
          <View className="flex-1">
            <Text className="text-gray-500 mb-6">Enter your details exactly as they appear on your official ID.</Text>
            
            <TouchableOpacity 
              onPress={() => uploadMockImage((uri) => setPersonal({ ...personal, photo: uri }))}
              className="self-center w-32 h-32 bg-gray-100 rounded-full items-center justify-center border border-dashed border-gray-300 mb-6 overflow-hidden"
            >
              {personal.photo ? (
                <Image source={{ uri: personal.photo }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <>
                  <Camera size={32} color={Colors.gray400} />
                  <Text className="text-xs text-gray-500 mt-2">Take Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <Input
              label="Full Name"
              placeholder="e.g. Ram Bahadur"
              value={personal.name}
              onChangeText={(text) => setPersonal({ ...personal, name: text })}
            />
            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={personal.dob}
              onChangeText={(text) => setPersonal({ ...personal, dob: text })}
            />

            <Button
              title="Next: License Details"
              onPress={() => setStep('license')}
              disabled={!personal.name || !personal.photo}
              className="mt-6"
            />
          </View>
        )}

        {step === 'license' && (
          <View className="flex-1">
            <Text className="text-gray-500 mb-6">Your license must be active and valid for your vehicle class.</Text>
            
            <Input
              label="License Number"
              placeholder="e.g. 01-12345"
              value={license.number}
              onChangeText={(text) => setLicense({ ...license, number: text })}
            />
            <Input
              label="Expiry Date"
              placeholder="YYYY-MM-DD"
              value={license.expDate}
              onChangeText={(text) => setLicense({ ...license, expDate: text })}
            />

            <Text className="text-sm font-medium mb-2 text-secondary">License Photo (Front)</Text>
            <TouchableOpacity 
              onPress={() => uploadMockImage((uri) => setLicense({ ...license, photo: uri }))}
              className="w-full h-40 bg-gray-100 rounded-xl items-center justify-center border border-dashed border-gray-300 mb-6 overflow-hidden"
            >
              {license.photo ? (
                <Image source={{ uri: license.photo }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <>
                  <ImageIcon size={32} color={Colors.gray400} />
                  <Text className="text-gray-500 mt-2">Upload License Picture</Text>
                </>
              )}
            </TouchableOpacity>

            <Button
              title="Next: Vehicle Info"
              onPress={() => setStep('vehicle')}
              disabled={!license.number || !license.photo}
              className="mt-4"
            />
          </View>
        )}

        {step === 'vehicle' && (
          <View className="flex-1">
            <Text className="text-gray-500 mb-6">What vehicle will you be driving?</Text>
            
            <View className="flex-row flex-wrap mb-4">
              {['bike', 'auto', 'cabEconomy'].map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setVehicle({ ...vehicle, type })}
                  className={`px-4 py-2 border rounded-full mr-2 mb-2 ${
                    vehicle.type === type ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`font-medium ${vehicle.type === type ? 'text-secondary' : 'text-gray-600'}`}>
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-between">
              <Input
                label="Make (Brand)"
                placeholder="e.g. Honda"
                value={vehicle.make}
                onChangeText={(text) => setVehicle({ ...vehicle, make: text })}
                className="flex-1 mr-2"
              />
              <Input
                label="Model"
                placeholder="e.g. Shine"
                value={vehicle.model}
                onChangeText={(text) => setVehicle({ ...vehicle, model: text })}
                className="flex-1 ml-2"
              />
            </View>

            <Input
              label="License Plate Number"
              placeholder="Ba 1 Pa 1234"
              value={vehicle.licensePlate}
              onChangeText={(text) => setVehicle({ ...vehicle, licensePlate: text })}
            />

            <Text className="text-sm font-medium mb-2 text-secondary">Bluebook / Registration Photo</Text>
            <TouchableOpacity 
              onPress={() => uploadMockImage((uri) => setVehicle({ ...vehicle, regPhoto: uri }))}
              className="w-full h-40 bg-gray-100 rounded-xl items-center justify-center border border-dashed border-gray-300 mb-6 overflow-hidden"
            >
              {vehicle.regPhoto ? (
                <Image source={{ uri: vehicle.regPhoto }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <>
                  <ImageIcon size={32} color={Colors.gray400} />
                  <Text className="text-gray-500 mt-2">Upload Registration Picture</Text>
                </>
              )}
            </TouchableOpacity>

            <Button
              title="Submit Application"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!vehicle.licensePlate || !vehicle.regPhoto || isLoading}
              className="mt-4 mb-10"
            />
          </View>
        )}

        {step === 'status' && renderStatus()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverRegistrationScreen;