import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Easing, Platform } from 'react-native';

const DEFAULTS = {
  size: 56,
  onlineColor: '#16a34a', // emerald-600
  offlineColor: '#ef4444', // red-500
  backgroundColor: '#111827', // gray-900 fallback track
  trackLight: '#e6e7ea',
  knobColor: '#fff',
  labelColor: '#0f172a',
};

export default function RaiderToggleButton({
  initial = false,
  onToggle = () => {},
  size = DEFAULTS.size,
  onlineColor = DEFAULTS.onlineColor,
  offlineColor = DEFAULTS.offlineColor,
  showLabel = true,
  onlineText = 'Online',
  offlineText = 'Offline',
  animated = true,
  useIcons = false,
}) {
  const [isOnline, setIsOnline] = useState(Boolean(initial));
  const anim = useRef(new Animated.Value(initial ? 1 : 0)).current;

  useEffect(() => {
    // Sync animation if initial changes
    animateTo(initial ? 1 : 0, false);
    setIsOnline(Boolean(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const animateTo = (toValue, withAnim = true) => {
    if (!animated || !withAnim) {
      anim.setValue(toValue);
      return;
    }
    Animated.timing(anim, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const toggle = () => {
    const next = !isOnline;
    setIsOnline(next);
    animateTo(next ? 1 : 0, true);
    onToggle(next);
  };

  // Geometry
  const width = Math.round(size * 2.1);
  const height = size * 0.6 + 12;
  const knobSize = size * 0.78;
  const knobLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, width - knobSize - 6],
  });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [offlineColor, onlineColor],
  });

  // Label opacity
  const onlineLabelOpacity = anim;
  const offlineLabelOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <Pressable
        onPress={toggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: isOnline }}
        accessibilityLabel={`Raider ${isOnline ? 'Online' : 'Offline'}`}
        hitSlop={8}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        <Animated.View
          style={[
            styles.track,
            {
              width,
              height,
              borderRadius: height / 2,
              backgroundColor: DEFAULTS.trackLight,
              overflow: 'hidden',
            },
          ]}
        >
          {/* Animated track color */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: 1, backgroundColor: trackColor }]} />

          {/* subtle overlay for contrast */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* labels */}
          <View style={styles.labelRow} pointerEvents="none">
            <Animated.Text numberOfLines={1} style={[styles.smallLabel, { left: 12, opacity: offlineLabelOpacity }]}>
              {offlineText}
            </Animated.Text>
            <Animated.Text numberOfLines={1} style={[styles.smallLabel, { right: 12, opacity: onlineLabelOpacity }]}>
              {onlineText}
            </Animated.Text>
          </View>

          {/* knob */}
          <Animated.View style={{ position: 'absolute', top: (height - knobSize) / 2, left: knobLeft }}>
            <Animated.View
              style={{
                width: knobSize,
                height: knobSize,
                borderRadius: knobSize / 2,
                backgroundColor: DEFAULTS.knobColor,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 4,
                elevation: 3,
                transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] }) }],
              }}
            >
              {useIcons ? (
                <Text style={{ fontSize: Math.round(knobSize * 0.36) }}>{isOnline ? '🔓' : '🔒'}</Text>
              ) : (
                <Text style={{ fontSize: Math.round(knobSize * 0.34), fontWeight: '700' }}>{isOnline ? 'ON' : 'OFF'}</Text>
              )}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Pressable>

      {/* external label */}
      {showLabel && (
        <View style={{ marginLeft: 12 }} pointerEvents="none">
          <Text style={{ fontWeight: '700', color: isOnline ? onlineColor : offlineColor }}>
            {isOnline ? 'Raider Online' : 'Raider Offline'}
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            {isOnline ? 'Players can be raided' : 'Not available for raids'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    padding: 2,
    justifyContent: 'center',
  },
  smallLabel: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -8 }],
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.95,
    includeFontPadding: false,
  },
  labelRow: {
    flex: 1,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { paddingVertical: 0 },
      android: { paddingVertical: 0 },
    }),
  },
});
