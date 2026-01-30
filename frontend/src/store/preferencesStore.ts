import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationSettings = {
  rideUpdates: boolean;
  promotions: boolean;
  sms: boolean;
  email: boolean;
};

export type ProfileDetails = {
  fullName: string;
  email: string;
  emergencyContact: string;
};

export type SavedPlaces = {
  home: string;
  work: string;
};

interface PreferencesState {
  notifications: NotificationSettings;
  profile: ProfileDetails;
  savedPlaces: SavedPlaces;

  setNotification: (key: keyof NotificationSettings, value: boolean) => void;
  setProfileField: (key: keyof ProfileDetails, value: string) => void;
  setSavedPlace: (key: keyof SavedPlaces, value: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      notifications: {
        rideUpdates: true,
        promotions: false,
        sms: true,
        email: true,
      },
      profile: {
        fullName: '',
        email: '',
        emergencyContact: '',
      },
      savedPlaces: {
        home: '',
        work: '',
      },

      setNotification: (key, value) =>
        set({
          notifications: { ...get().notifications, [key]: value },
        }),
      setProfileField: (key, value) =>
        set({
          profile: { ...get().profile, [key]: value },
        }),
      setSavedPlace: (key, value) =>
        set({
          savedPlaces: { ...get().savedPlaces, [key]: value },
        }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default usePreferencesStore;
