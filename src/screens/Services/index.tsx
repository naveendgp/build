import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import Toolbar from '../../components/Toolbar';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Service } from '../../apiService/types/profileTypes';
import styles from './styles';

type ServicesNavProp = NativeStackNavigationProp<RootStackParamList, 'Services'>;

const ServicesScreen: React.FC = () => {
  const navigation = useNavigation<ServicesNavProp>();
  const { profile } = useProfileStore();
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    navigation.navigate('ShopList', { service });
  };

  const renderServiceCard = (service: Service, index: number) => {
    const isSelected = selectedService?.service_name === service.service_name;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.serviceCard,
          isSelected && styles.selectedServiceCard
        ]}
        onPress={() => handleServiceSelect(service)}
        activeOpacity={0.7}
      >
        <View style={styles.serviceCardContent}>
          <View style={styles.serviceInfo}>
            <View style={styles.radioButtonContainer}>
              <View style={[
                styles.radioButton,
                isSelected && styles.selectedRadioButton
              ]}>
                {isSelected && <View style={styles.radioButtonInner} />}
              </View>
            </View>
            
            <View style={styles.serviceTextContainer}>
              <CustomText style={[
                styles.serviceName,
                isSelected && styles.selectedServiceName
              ]}>
                {service.service_name}
              </CustomText>
              <View style={styles.arrowContainer}>
                <Image 
                  source={require('../../assets/icons/nav_arrow_straight.png')} 
                  style={styles.arrowIcon}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.serviceIllustration}>
            <Image 
              source={{ uri: service.image_url }} 
              style={styles.serviceImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Services" />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.servicesContainer}>
          {profile?.services_offered?.map((service, index) => 
            renderServiceCard(service, index)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServicesScreen;
