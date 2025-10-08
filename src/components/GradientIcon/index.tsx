import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CustomIcon from '../Icon';

const GradientIcon = ({ type, name, size = 40 }) => {
  return (
    <LinearGradient
      colors={['#000000', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <CustomIcon type={type} name={name} size={size * 0.6} color="#fff" />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GradientIcon;
