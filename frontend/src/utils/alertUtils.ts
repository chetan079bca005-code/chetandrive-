import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

let isPlaying = false;

export const triggerAlertFeedback = async (type: 'offer' | 'arrival' = 'offer') => {
  try {
    await Haptics.notificationAsync(
      type === 'arrival'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
  } catch {
    // ignore haptics errors
  }

  try {
    Vibration.vibrate(type === 'arrival' ? [0, 300, 150, 300] : [0, 200]);
  } catch {
    // ignore vibration errors
  }

  if (isPlaying) return;

  try {
    isPlaying = true;
    const { sound } = await Audio.Sound.createAsync({
      uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
    });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        sound.unloadAsync();
        isPlaying = false;
      }
    });
  } catch {
    isPlaying = false;
  }
};

export default triggerAlertFeedback;
