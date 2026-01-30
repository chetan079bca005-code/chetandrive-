import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints: number[]; // Heights in pixels from bottom
  initialSnap?: number; // Index of initial snap point
  onSnapChange?: (index: number) => void;
  handleComponent?: React.ReactNode;
  backgroundStyle?: object;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  snapPoints,
  initialSnap = 0,
  onSnapChange,
  handleComponent,
  backgroundStyle,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT - snapPoints[initialSnap])).current;
  const lastSnap = useRef(initialSnap);
  const currentTranslateY = useRef(SCREEN_HEIGHT - snapPoints[initialSnap]);

  // Listen to translateY changes
  useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      currentTranslateY.current = value;
    });
    return () => translateY.removeListener(listenerId);
  }, [translateY]);

  const snapToIndex = useCallback((index: number) => {
    const targetY = SCREEN_HEIGHT - snapPoints[index];
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
    lastSnap.current = index;
    onSnapChange?.(index);
  }, [snapPoints, onSnapChange, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        translateY.setOffset(currentTranslateY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position
        const newY = currentTranslateY.current + gestureState.dy;
        const maxY = SCREEN_HEIGHT - snapPoints[0]; // Collapsed position
        const minY = SCREEN_HEIGHT - snapPoints[snapPoints.length - 1]; // Expanded position
        
        // Clamp with resistance at edges
        if (newY < minY) {
          translateY.setValue((newY - minY) * 0.3);
        } else if (newY > maxY) {
          translateY.setValue((newY - maxY) * 0.3);
        } else {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        
        const currentY = currentTranslateY.current;
        const velocity = gestureState.vy;
        
        // Find closest snap point
        let targetIndex = 0;
        let minDistance = Infinity;
        
        snapPoints.forEach((point, index) => {
          const snapY = SCREEN_HEIGHT - point;
          const distance = Math.abs(currentY - snapY);
          
          // Consider velocity
          if (velocity > 0.5 && index < lastSnap.current) {
            // Swiping down, prefer lower snap points
            if (index < targetIndex || distance < minDistance) {
              minDistance = distance;
              targetIndex = index;
            }
          } else if (velocity < -0.5 && index > lastSnap.current) {
            // Swiping up, prefer higher snap points
            if (index > targetIndex || distance < minDistance) {
              minDistance = distance;
              targetIndex = index;
            }
          } else if (distance < minDistance) {
            minDistance = distance;
            targetIndex = index;
          }
        });
        
        snapToIndex(targetIndex);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        backgroundStyle,
        {
          transform: [{ translateY }],
          height: SCREEN_HEIGHT,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Handle */}
      {handleComponent || (
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
      )}
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});

export default BottomSheet;
