import React from 'react';
import { View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import styles from './styles';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import CustomBtn from '../../components/CustomBtn';
import { VendorProfile, Service, ServiceItem } from '../../apiService/types/profileTypes';
import Toolbar from '../../components/Toolbar';

type ServicesPricingNavProp = NativeStackNavigationProp<RootStackParamList, 'ServicesPricing'>;

const ServicesPricingScreen: React.FC = () => {
  const navigation = useNavigation<ServicesPricingNavProp>();
  const { profile } = useProfileStore();

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save services and pricing');
    navigation.goBack();
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <CustomText style={styles.serviceName}>{item.service_name}</CustomText>
        <CustomText style={styles.pricingType}>
          {item.pricing_type === 'per_pc' ? 'Per Piece' : 'Per Kg'}
        </CustomText>
      </View>
      
      <CustomText style={styles.serviceDescription}>
        {item.service_description}
      </CustomText>
      
      <View style={styles.itemsContainer}>
        <CustomText style={styles.itemsTitle}>Items ({item.items.length})</CustomText>
        {item.items.slice(0, 3).map((serviceItem: ServiceItem, index: number) => (
          <View key={index} style={styles.itemRow}>
            <CustomText style={styles.itemName}>{serviceItem.item_name}</CustomText>
            <CustomText style={styles.itemPrice}>
              ₹{serviceItem.item_price} {item.pricing_type === 'per_pc' ? '/pc' : '/kg'}
            </CustomText>
          </View>
        ))}
        {item.items.length > 3 && (
          <CustomText style={styles.moreItems}>
            +{item.items.length - 3} more items
          </CustomText>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Services & Pricing" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Available Services</CustomText>
          
          {profile?.services_offered && (
            <FlatList
              data={profile.services_offered}
              renderItem={renderServiceItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Service Settings</CustomText>
          
          <CustomTextInput
            label="Max Count Per Day"
            value="100"
            onChangeText={() => {}}
            keyboardType="number-pad"
          />
          
          <CustomTextInput
            label="Express Service Multiplier"
            value="1.5"
            onChangeText={() => {}}
            keyboardType="numeric"
          />
        </View>

        <CustomBtn
          title="Update Pricing"
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServicesPricingScreen;
