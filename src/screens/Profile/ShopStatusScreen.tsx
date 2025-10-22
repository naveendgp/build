import React from 'react';
import { View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import styles from './styles';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import CustomBtn from '../../components/CustomBtn';
import { VendorProfile } from '../../apiService/types/profileTypes';
import Toolbar from '../../components/Toolbar';

type ShopStatusNavProp = NativeStackNavigationProp<RootStackParamList, 'ShopStatus'>;

const ShopStatusScreen: React.FC = () => {
  const navigation = useNavigation<ShopStatusNavProp>();
  const { profile } = useProfileStore();

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save shop status');
    navigation.goBack();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#34C759';
      case 'close':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'close':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Shop Status" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Current Status</CustomText>
          
          <View style={styles.statusCard}>
            <View style={styles.statusInfo}>
              <CustomText style={styles.statusLabel}>Shop Status</CustomText>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(profile?.shop_status?.status || '') }]}>
                <CustomText style={styles.statusText}>
                  {getStatusText(profile?.shop_status?.status || '')}
                </CustomText>
              </View>
            </View>
            
            <View style={styles.switchRow}>
              <CustomText style={styles.switchLabel}>Toggle Shop Status</CustomText>
              <Switch
                value={profile?.shop_status?.status === 'open'}
                onValueChange={() => {}}
                trackColor={{ false: '#E0E0E0', true: '#1B2A4A' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Business Hours</CustomText>
          
          <View style={styles.hoursCard}>
            <CustomText style={styles.hoursTitle}>Operating Hours</CustomText>
            <CustomText style={styles.hoursText}>Monday - Sunday</CustomText>
            <CustomText style={styles.hoursText}>9:00 AM - 9:00 PM</CustomText>
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Auto Settings</CustomText>
          
          <View style={styles.switchRow}>
            <CustomText style={styles.switchLabel}>Auto Close at End of Day</CustomText>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: '#E0E0E0', true: '#1B2A4A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.switchRow}>
            <CustomText style={styles.switchLabel}>Auto Open in Morning</CustomText>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#E0E0E0', true: '#1B2A4A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Statistics</CustomText>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>{profile?.total_orders || 0}</CustomText>
              <CustomText style={styles.statLabel}>Total Orders</CustomText>
            </View>
            
            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>
                {profile?.rating?.average || 0}
              </CustomText>
              <CustomText style={styles.statLabel}>Average Rating</CustomText>
            </View>
            
            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>
                {profile?.rating?.total_reviews || 0}
              </CustomText>
              <CustomText style={styles.statLabel}>Total Reviews</CustomText>
            </View>
          </View>
        </View>

        <CustomBtn
          title="Update Status"
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShopStatusScreen;
