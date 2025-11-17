import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const CONTAINER_WIDTH = 235;
const CONTAINER_HEIGHT = 48;
const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 32;

export default function SwipeButton({ onComplete }: { onComplete: () => void }) {
  const translateX = useSharedValue(0);

  const MAX_RANGE = CONTAINER_WIDTH - THUMB_WIDTH - 8; // 8px padding

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = Math.min(Math.max(e.translationX, 0), MAX_RANGE);
    })
    .onEnd(() => {
      if (translateX.value > MAX_RANGE * 0.7) {
        translateX.value = withSpring(MAX_RANGE, {}, () => {
          runOnJS(onComplete)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Accept Order</Text>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Text style={styles.arrow}>{">>"}</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    backgroundColor: "#038203",
    borderRadius: 16,
    justifyContent: "center",
  },
  label: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    zIndex: 1,
  },
  thumb: {
    position: "absolute",
    left: 8,
    top: 8,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    backgroundColor: "#FCFCFC",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  arrow: {
    color: "#038203",
    fontSize: 18,
    fontWeight: "bold",
  },
});
