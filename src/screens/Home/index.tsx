import React from 'react';
import { View, SafeAreaView, ImageBackground } from 'react-native';
import CustomText from '../../components/Text';
import styles from './styles';
import CustomeDialog from '../../components/Dialog';

const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrapper}>
        <CustomText style={styles.title}>Welcome Home</CustomText>
        <CustomText style={styles.subtitle}>
          This is your home screen.
        </CustomText>

        <CustomeDialog
          visible={true}
          title="Verification In Progress"
          subtitle="Your documents are being verified. Please wait."
          buttonText="Close"
          onButtonPress={() => console.log('Dialog closed')}
          btnVisible={true}
          imageSource={require('../../assets/background/bg.png')}
        />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
