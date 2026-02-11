// BasicDraggableSlider.tsx
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  Dimensions,
  I18nManager,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  interpolateColor,
  useDerivedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { COLORS } from '../../constants';
import CustomIcon from '../Icon';
import styles from './style';

// 📏 Constants
const { width: screenWidth } = Dimensions.get('window');
const DEFAULT_HORIZONTAL_PADDING = 20;
const DEFAULT_SLIDER_WIDTH = Math.min(screenWidth - DEFAULT_HORIZONTAL_PADDING, 320);
const THUMB_WIDTH = 60;
const TOUCH_PADDING = 12;
const HAPTIC_THRESHOLD = 0.6;
const FLING_VELOCITY_THRESHOLD = 700;
const COMPLETION_THRESHOLD = 0.75;

type BasicDraggableSliderProps = {
  onComplete: () => void;
  text?: string;
  disabled?: boolean;
  onProgress?: (progress: number) => void;
  onDragStart?: () => void;
  onDragEnd?: (completed: boolean) => void;
  reverse?: boolean;
};

export type BasicDraggableSliderHandle = {
  reset: () => void;
};

const DraggableSlider = forwardRef<BasicDraggableSliderHandle, BasicDraggableSliderProps>(
  (
    {
      onComplete,
      text = 'ARRIVED',
      disabled = false,
      onProgress,
      onDragStart,
      onDragEnd,
      reverse = I18nManager.isRTL,
    },
    ref
  ) => {

    const sliderWidth = useSharedValue(DEFAULT_SLIDER_WIDTH);
    const translateX = useSharedValue(0);
    const context = useSharedValue({ x: 0 });
    const isCompleted = useSharedValue(false);
    const hapticTriggered = useSharedValue(false);

    // derived range and progress
    const sliderRange = useDerivedValue(() => Math.max(0, sliderWidth.value - THUMB_WIDTH));
    const progress = useDerivedValue(() => Math.max(0, Math.min(1, translateX.value / (sliderRange.value || 1))));

    // expose reset
    useImperativeHandle(ref, () => ({
      reset: () => {
        translateX.value = withSpring(0);
        isCompleted.value = false;
        hapticTriggered.value = false;
      },
    }), []);

    // haptics
    const triggerHaptic = useCallback(() => {
      ReactNativeHapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }, []);

    const triggerSuccessHaptic = useCallback(() => {
      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }, []);

    // onProgress reaction
    useAnimatedReaction(
      () => progress.value,
      (p, prev) => {
        if (onProgress && p !== prev) {
          runOnJS(onProgress)(p);
        }
      },
      []
    );

    // onComplete reaction
    useAnimatedReaction(
      () => isCompleted.value,
      (completed, previous) => {
        if (completed && !previous) {
          runOnJS(triggerSuccessHaptic)();
          runOnJS(onComplete)();
          if (onDragEnd) runOnJS(onDragEnd)(true);
        } else if (!completed && previous && onDragEnd) {
          runOnJS(onDragEnd)(false);
        }
      },
      []
    );

    // gesture
    const gesture = Gesture.Pan()
      .enabled(!disabled)
      .onStart(() => {
        context.value = { x: translateX.value };
      })
      .onUpdate((event) => {
        if (disabled || isCompleted.value) return;
        const nextX = Math.min(Math.max(context.value.x + event.translationX, 0), sliderRange.value);
        translateX.value = nextX;

        const p = nextX / (sliderRange.value || 1);
        if (p >= HAPTIC_THRESHOLD && !hapticTriggered.value) {
          hapticTriggered.value = true;
          runOnJS(triggerHaptic)();
        } else if (p < HAPTIC_THRESHOLD && hapticTriggered.value) {
          hapticTriggered.value = false;
        }
      })
      .onEnd((event) => {
        if (disabled || isCompleted.value) return;

        const velocity = event.velocityX;
        const p = progress.value;
        const shouldComplete = p >= COMPLETION_THRESHOLD || velocity > FLING_VELOCITY_THRESHOLD;

        if (shouldComplete) {
          // complete
          translateX.value = withTiming(sliderRange.value, {}, (finished) => {
            if (finished) isCompleted.value = true;
          });
        } else {
          // return back smoothly to 0 (original behavior)
          translateX.value = withSpring(0);
          hapticTriggered.value = false;
        }
      });

    // animated styles
    const animatedThumbStyle = useAnimatedStyle(() => {
      const scale = interpolate(progress.value, [0, 0.35, 0.7, 1], [1, 1.08, 1.12, 1.18], Extrapolate.CLAMP);
      const bg = interpolateColor(progress.value, [0, 0.6, 1], [
        COLORS.BLACK,
        COLORS.DARK_GRAY,
        COLORS.GREEN,
      ]);
      return {
        transform: [{ translateX: translateX.value }, { scale }],
        backgroundColor: bg,
        zIndex: 3,
      };
    });

    const animatedSliderStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [COLORS.LIGHT_GRAY_3, COLORS.LIGHT_GREEN]
      ),
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
      opacity: interpolate(progress.value, [0, 0.3, 0.7], [1, 0.75, 0.3], Extrapolate.CLAMP),
      transform: [{ translateX: interpolate(progress.value, [0, 1], [0, 20], Extrapolate.CLAMP) }],
    }));

    // layout measure
    const onContainerLayout = useCallback((e: any) => {
      const w = e.nativeEvent.layout.width || DEFAULT_SLIDER_WIDTH;
      sliderWidth.value = Math.max(w, THUMB_WIDTH + 8);
      const maxX = Math.max(0, sliderWidth.value - THUMB_WIDTH);
      if (translateX.value > maxX) translateX.value = maxX;
    }, []);

    return (
      <View style={styles.container}>
        <View style={styles.measureContainer} onLayout={onContainerLayout}>
          <Animated.View style={[styles.slider, animatedSliderStyle]}>
            <Animated.View style={[styles.textContainer, animatedTextStyle]}>
              <Text
                style={[styles.sliderText, disabled && styles.disabledText]}
                accessible={false}>
                {text}
              </Text>
            </Animated.View>
            <GestureDetector gesture={gesture}>
              <Animated.View
                style={[styles.thumbTouchWrapper, { left: -TOUCH_PADDING }]}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={text}
                accessibilityState={{ disabled }}>
                <Animated.View style={[styles.thumb, animatedThumbStyle]}>
                  <CustomIcon
                    type="FontAwesome"
                    name="angle-double-right"
                    size={26}
                    color={COLORS.WHITE}
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </View>
      </View>
    );
  }
);

export default DraggableSlider;
