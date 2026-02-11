import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Modal,
  Dimensions,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  ScrollView,
  InteractionManager,
  Platform,
} from 'react-native';
import styles from './styles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import CustomIcon from '../Icon';
import SvgCrossCloseIcon from '../../assets/auto-generated-svg-icons/CrossCloseIcon';


const { height: screenHeight } = Dimensions.get('window');
const MAX_HEIGHT_PERCENTAGE = 75;

const SMOOTH_EASING = Easing.bezier(0.2, 0.0, 0.2, 1);
const ANIMATION_DURATION = 200;

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
  bgColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  headerText?: string;
  onHeaderPress?: () => void;
}

const CustomBottomSheet: React.FC<BottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  dismissible = false,
  bgColor = 'transparent',
  height,
  style,
  headerText,
  onHeaderPress,
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();


  const handleHeaderPress = () => {
    if (onHeaderPress) {
      onHeaderPress();
    } else {
      onClose();
    }
  };

  // Bottom and top margins for the sheet
  const BOTTOM_MARGIN = 16;
  const SIDE_MARGIN = 12;

  const headerButtonHeight = 56;
  const headerMarginBottom = 12;
  const topPadding = 2;
  const minInitialHeight = headerButtonHeight + headerMarginBottom + topPadding + 16 + 50; // 16 for bottom margin

  const maxHeight = useMemo(() => {
    // Account for bottom margin when calculating max height
    const availableHeight = screenHeight - BOTTOM_MARGIN;
    // If height prop is provided, use it as a maximum constraint (percentage of screen)
    // Otherwise, use the default MAX_HEIGHT_PERCENTAGE
    if (height) {
      return Math.min(availableHeight * (height / 100), availableHeight * (MAX_HEIGHT_PERCENTAGE / 100));
    }
    return availableHeight * (MAX_HEIGHT_PERCENTAGE / 100);
  }, [height]);
  const sheetHeight = useMemo(() => {
    if (contentHeight === 0) {
      return minInitialHeight;
    }
    // Add only 16px bottom margin (BOTTOM_MARGIN)
    const calculatedHeight = contentHeight + BOTTOM_MARGIN;
    return Math.min(calculatedHeight, maxHeight);
  }, [contentHeight, maxHeight]);

  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setModalVisible(true);
      // Reset content height when opening to ensure fresh measurement
      setContentHeight(0);
      cancelAnimation(translateY);
      cancelAnimation(backdropOpacity);

      translateY.value = screenHeight;
      backdropOpacity.value = 0;

      InteractionManager.runAfterInteractions(() => {
        translateY.value = withTiming(0, {
          duration: ANIMATION_DURATION,
          easing: SMOOTH_EASING,
        });

        backdropOpacity.value = withTiming(1, {
          duration: ANIMATION_DURATION,
          easing: SMOOTH_EASING,
        });
      });
    } else {
      cancelAnimation(translateY);
      cancelAnimation(backdropOpacity);
      translateY.value = withTiming(screenHeight, {
        duration: ANIMATION_DURATION,
        easing: SMOOTH_EASING,
      });
      backdropOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: SMOOTH_EASING,
      });

      setTimeout(() => {
        setModalVisible(false);
        // Reset content height when closing
        setContentHeight(0);
      }, ANIMATION_DURATION);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && contentHeight > 0) {
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: SMOOTH_EASING,
      });
    }
  }, [sheetHeight, isVisible, contentHeight]);

  const sheetAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: translateY.value }],
    };
  }, []);

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: backdropOpacity.value,
    };
  }, []);

  const sheetStyle = useMemo(
    () => [
      styles.sheet,
      Platform.OS === 'android' && Platform.Version === 35 && {
        marginBottom: insets.bottom || 40,
      },
      {
        backgroundColor: bgColor,
        maxHeight,
        minHeight: minInitialHeight,
        height: sheetHeight,
      },
      style,
    ],
    [bgColor, maxHeight, minInitialHeight, sheetHeight, style, insets.bottom],
  );

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={dismissible ? onClose : undefined}
      hardwareAccelerated={true}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdropTouchable}
          onPress={dismissible ? onClose : undefined}
        >
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
        </TouchableOpacity>

        <Animated.View style={[styles.sheetWrapper, sheetAnimatedStyle]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleHeaderPress}
            activeOpacity={0.8}
          >
            <SvgCrossCloseIcon />
          </TouchableOpacity>

          <SafeAreaView edges={['top', 'bottom']} style={sheetStyle}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              onContentSizeChange={(width, height) => {
                if (height > 0 && height !== contentHeight) {
                  setContentHeight(height);
                }
              }}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomBottomSheet;
