import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer } from 'expo-audio';

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
    const player = createAudioPlayer('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    player.play();
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // ignore
      } finally {
        isPlaying = false;
      }
    }, 3000);
  } catch {
    isPlaying = false;
  }
};

export default triggerAlertFeedback;
