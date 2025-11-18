import React, { useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomText from '../../components/Text';
import Toolbar from '../../components/Toolbar';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { Service } from '../../apiService/types/profileTypes';
import { RootStackParamList } from '../../navigation/AppNavigator';
import styles from './styles';
import RightArrowIcon from '../../assets/auto-generated-svg-icons/RightArrowIcon';
import CheckIcon from '../../assets/auto-generated-svg-icons/CheckIcon';
import { COLORS } from '../../constants/colors';

type ServicesNavProp = NativeStackNavigationProp<RootStackParamList, 'Services'>;

const ServicesScreen: React.FC = () => {
  const navigation = useNavigation<ServicesNavProp>();
  const { profile } = useProfileStore();
  const services = profile?.services_offered || [];
  const [selectedServices, setSelectedServices] = useState<string[]>(
    services.map(service => service.service_name),
  );

  const handleServicePress = (service: Service) => {
    // Navigate to ServiceDetail with the selected service
    navigation.navigate('ServiceDetail', { service });
  };

  const serviceNote = useMemo(
    () => 'Note: Select the services available at your shop',
    [],
  );

  const renderServiceItem = (item: Service) => {
    const isSelected = selectedServices.includes(item.service_name);

    return (
      <TouchableOpacity
        key={item.service_name}
        activeOpacity={0.9}
        style={[
          styles.serviceOptionCard,
          isSelected && styles.serviceOptionCardSelected,
        ]}
        onPress={() => handleServicePress(item)}
      >
        <View style={styles.serviceOptionLeft}>
          <View
            style={[
              styles.serviceCheckbox,
              isSelected && styles.serviceCheckboxSelected,
            ]}
          >
            {isSelected && <CheckIcon width={16} height={16} color={COLORS.WHITE} />}
          </View>
          <View style={styles.serviceInfo}>
            <CustomText
              style={[
                styles.serviceOptionName,
                isSelected && styles.serviceOptionNameSelected,
              ]}
            >
              {item.service_name}
            </CustomText>
            <RightArrowIcon width={24} height={24} color={COLORS.INPUT_TEXT} />

          </View>
        </View>

        <View style={styles.serviceOptionRight}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.serviceImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.serviceImagePlaceholder} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Services & Offer Details" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>

          <View style={styles.servicesList}>
            {services.map(renderServiceItem)}
          </View>

          <CustomText style={styles.serviceNote}>{serviceNote}</CustomText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServicesScreen;
