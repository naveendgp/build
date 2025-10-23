import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import styles from './styles';
import { useAuthStore } from '../../apiService/store/useAuthStore';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../../apiService/api/profileApi';
import { showErrorToast } from '../../utils/Toast';
import { ProfileResponse } from '../../apiService/types/profileTypes';
import { ErrorResponse } from '../../apiService/types/authTypes';
import { AxiosError } from 'axios';

export type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { logout, token, documentState } = useAuthStore();
  const { profile, setProfile, setLoading, setError } = useProfileStore();

  // Fetch profile data
  const { data, isLoading, error, refetch } = useQuery<
    ProfileResponse,
    AxiosError<ErrorResponse>
  >({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  // Handle success and error
  useEffect(() => {
    if (data) {
      setProfile(data.data);
    }
    if (error) {
      const msg = error.response?.data?.message || error.message;
      setError(msg);
      showErrorToast(msg);
    }
  }, [data, error, setProfile, setError]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const profileOptions = [
    {
      id: '1',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: '👤',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: '2',
      title: 'Business Settings',
      subtitle: 'Manage your business details',
      icon: '🏪',
      onPress: () => navigation.navigate('BusinessSettings'),
    },
    {
      id: '3',
      title: 'Services',
      subtitle: 'Select and configure services',
      icon: '🧺',
      onPress: () => navigation.navigate('Services'),
    },
    // {
    //   id: '3a',
    //   title: 'Services & Pricing',
    //   subtitle: 'Configure your services and pricing',
    //   icon: '💰',
    //   onPress: () => navigation.navigate('ServicesPricing'),
    // },
    {
      id: '4',
      title: 'Shop Status',
      subtitle: 'Manage your shop availability',
      icon: '🕒',
      onPress: () => navigation.navigate('ShopStatus'),
    },
    {
      id: '5',
      title: 'Wallet',
      subtitle: 'View your wallet balance',
      icon: '💳',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      id: '6',
      title: 'Notification Settings',
      subtitle: 'Configure your notifications',
      icon: '🔔',
      onPress: () => console.log('Notification Settings'),
    },
    {
      id: '7',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: '❓',
      onPress: () => console.log('Help & Support'),
    },
    {
      id: '8',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'ℹ️',
      onPress: () => console.log('About'),
    },
  ];

  const getDocumentStatusText = () => {
    switch (documentState) {
      case 'active':
        return 'Verified';
      case 'pending':
        return 'Pending Verification';
      case 'upload':
        return 'Under Review';
      case 'retry':
        return 'Re-upload Required';
      default:
        return 'Not Verified';
    }
  };

  const getDocumentStatusColor = () => {
    switch (documentState) {
      case 'active':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'upload':
        return '#007AFF';
      case 'retry':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* <View style={styles.header}>
        <CustomText style={styles.title}>Profile</CustomText>
        <CustomText style={styles.subtitle}>Manage your account</CustomText>
      </View> */}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B2A4A" />
          <CustomText style={styles.loadingText}>Loading profile...</CustomText>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Info Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <CustomText style={styles.avatarText}>VD</CustomText>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <CustomText style={styles.profileName}>
                {profile?.owner_name || 'Loading...'}
              </CustomText>
              <CustomText style={styles.profileEmail}>
                {profile?.email || 'Loading...'}
              </CustomText>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getDocumentStatusColor() },
                ]}
              >
                <CustomText style={styles.statusText}>
                  {getDocumentStatusText()}
                </CustomText>
              </View>
            </View>
          </View>

          {/* Profile Options */}
          <View style={styles.optionsContainer}>
            {profileOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <CustomText style={styles.optionIcon}>
                    {option.icon}
                  </CustomText>
                  <View style={styles.optionTextContainer}>
                    <CustomText style={styles.optionTitle}>
                      {option.title}
                    </CustomText>
                    <CustomText style={styles.optionSubtitle}>
                      {option.subtitle}
                    </CustomText>
                  </View>
                </View>
                <CustomText style={styles.optionArrow}>›</CustomText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <CustomText style={styles.logoutText}>Logout</CustomText>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;
