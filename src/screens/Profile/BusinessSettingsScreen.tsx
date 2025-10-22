import React from 'react';
import { View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import styles from './styles';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import CustomBtn from '../../components/CustomBtn';
import { VendorProfile } from '../../apiService/types/profileTypes';
import Toolbar from '../../components/Toolbar';

type BusinessSettingsNavProp = NativeStackNavigationProp<RootStackParamList, 'BusinessSettings'>;

const BusinessSettingsScreen: React.FC = () => {
  const navigation = useNavigation<BusinessSettingsNavProp>();
  const { profile } = useProfileStore();

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save business settings');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Business Settings" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Shop Information</CustomText>
          
          <CustomTextInput
            label="Shop Name"
            value={profile?.shop_name || ''}
            onChangeText={() => {}}
          />
          
          <CustomTextInput
            label="GST Number"
            value={profile?.gst_number || ''}
            onChangeText={() => {}}
          />
          
          <CustomTextInput
            label="Shop License Number"
            value={profile?.shop_license_number || ''}
            onChangeText={() => {}}
          />
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Business Hours</CustomText>
          
          <View style={styles.switchRow}>
            <CustomText style={styles.switchLabel}>Auto Accept Orders</CustomText>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#E0E0E0', true: '#1B2A4A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.switchRow}>
            <CustomText style={styles.switchLabel}>Express Service Available</CustomText>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: '#E0E0E0', true: '#1B2A4A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Service Limits</CustomText>
          
          <CustomTextInput
            label="Max Orders Per Day"
            value="50"
            onChangeText={() => {}}
            keyboardType="number-pad"
          />
          
          <CustomTextInput
            label="Max Weight Per Order (Kg)"
            value="10"
            onChangeText={() => {}}
            keyboardType="number-pad"
          />
        </View>

        <CustomBtn
          title="Save Settings"
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BusinessSettingsScreen;
