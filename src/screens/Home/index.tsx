import React, { useEffect } from 'react';
import { View } from 'react-native';
import CustomText from '../../components/Text';
import styles from './styles';
import { useAuthStore } from '../../apiService/store/useAuthStore';

const HomeScreen: React.FC = () => {
  const token = useAuthStore(state => state.token);
  const setLogin = useAuthStore(state => state.setIsLoggedIn);

  useEffect(() => {
    console.log('token', token);
  }, [token]);

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <CustomText style={styles.title}>Welcome Home</CustomText>
        <CustomText style={styles.subtitle}>
          `This is your home screen. {token}`
        </CustomText>


      </View>
    </View>
  );
};

export default HomeScreen;
