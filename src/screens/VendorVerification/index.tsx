import React from 'react';
import {
  View,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import CustomText from '../../components/Text';
import styles from './styles';
import CustomBtn from '../../components/CustomBtn';
import { useUserStore } from '../../store/useStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

type VendorNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'VendorVerification'
>;

const VendorVerificationScreen: React.FC = () => {
  const navigation = useNavigation<VendorNavProp>();
  const setLoggedIn = useUserStore(state => state.setLoggedIn);

  const handleComplete = () => {
    // In a real app you'd submit vendor documents and wait for approval.
    // Here we'll mark the user logged in and navigate to Home.
    setLoggedIn(true);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrapper}>
        <CustomText style={styles.title}>Vendor verification</CustomText>
        <CustomText style={styles.subtitle}>
          Please complete your vendor verification. Upload required documents
          and wait for approval.
        </CustomText>

        <View style={{ marginTop: 20 }}>
          <CustomBtn title="Complete verification" onPress={handleComplete} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default VendorVerificationScreen;
