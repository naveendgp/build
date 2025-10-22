import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
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

type EditProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileNavProp>();
  const { profile } = useProfileStore();

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save profile changes');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Edit Profile" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Personal Information</CustomText>
          
          <CustomTextInput
            label="Owner Name"
            value={profile?.owner_name || ''}
            onChangeText={() => {}}
          />
          
          <CustomTextInput
            label="Email"
            value={profile?.email || ''}
            onChangeText={() => {}}
            keyboardType="email-address"
          />
          
          <CustomTextInput
            label="Phone Number"
            value={profile?.phone || ''}
            onChangeText={() => {}}
            keyboardType="phone-pad"
            editable={false}
          />
          
          <CustomTextInput
            label="Aadhaar Number"
            value={profile?.aadhaar_number || ''}
            onChangeText={() => {}}
            keyboardType="number-pad"
            maxLength={12}
          />
          
          <CustomTextInput
            label="PAN Number"
            value={profile?.pan_number || ''}
            onChangeText={() => {}}
            maxLength={10}
          />
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Business Information</CustomText>
          
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
          <CustomText style={styles.sectionTitle}>Address</CustomText>
          
          <CustomTextInput
            label="Address Line 1"
            value={profile?.address?.address_line1 || ''}
            onChangeText={() => {}}
          />
          
          <CustomTextInput
            label="Address Line 2"
            value={profile?.address?.address_line2 || ''}
            onChangeText={() => {}}
          />
          
          <CustomTextInput
            label="City"
            value={profile?.address?.city || ''}
            onChangeText={() => {}}
          />
          
          <CustomTextInput
            label="State"
            value={profile?.address?.state || ''}
            onChangeText={() => {}}
          />
          
          <CustomTextInput
            label="Pincode"
            value={profile?.address?.pincode || ''}
            onChangeText={() => {}}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <CustomTextInput
            label="Landmark"
            value={profile?.address?.landmark || ''}
            onChangeText={() => {}}
          />
        </View>

        <CustomBtn
          title="Save Changes"
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
