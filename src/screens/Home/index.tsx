import React from 'react';
import { View, SafeAreaView, ImageBackground } from 'react-native';
import CustomText from '../../components/Text';
import styles from './styles';

const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../assets/background/bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.wrapper}>
          <CustomText style={styles.title}>Welcome Home</CustomText>
          <CustomText style={styles.subtitle}>
            This is your home screen.
          </CustomText>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default HomeScreen;
