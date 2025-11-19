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
import CustomIcon from '../../components/Icon';
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
import { COLORS, FONTFAMILY } from '../../constants/colors';

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
      title: 'Profile',
      icon: 'person',
      iconType: 'MaterialIcons' as const,
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: '2',
      title: 'Shop Details',
      icon: 'store',
      iconType: 'MaterialIcons' as const,
      onPress: () => navigation.navigate('BusinessSettings'),
    },
    {
      id: '3',
      title: 'Bank Details',
      icon: 'account-balance',
      iconType: 'MaterialIcons' as const,
      onPress: () => console.log('Bank Details'),
    },
    {
      id: '4',
      title: 'Services & Offer Details',
      icon: 'card-giftcard',
      iconType: 'MaterialIcons' as const,
      onPress: () => navigation.navigate('Services'),
    },
    {
      id: '5',
      title: 'Shop Review',
      icon: 'star',
      iconType: 'MaterialIcons' as const,
      onPress: () => console.log('Shop Review'),
    },
    {
      id: '6',
      title: 'Help & support',
      icon: 'headset-mic',
      iconType: 'MaterialIcons' as const,
      onPress: () => console.log('Help & Support'),
    },
    {
      id: '7',
      title: 'Privacy & Security',
      icon: 'lock',
      iconType: 'MaterialIcons' as const,
      onPress: () => console.log('Privacy & Security'),
    },
    {
      id: '8',
      title: 'Terms & Condition',
      icon: 'description',
      iconType: 'MaterialIcons' as const,
      onPress: () => console.log('Terms & Condition'),
    },
    {
      id: '9',
      title: 'Logout',
      icon: 'logout',
      iconType: 'MaterialIcons' as const,
      onPress: handleLogout,
      isLogout: true,
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.TEXT_PRIMARY} />
          <CustomText style={styles.loadingText}>Loading profile...</CustomText>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.header}>
            <CustomText style={styles.title}>Profile</CustomText>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <CustomText style={styles.summaryTitle}>To Be Received</CustomText>
            <CustomText style={styles.summaryAmount}>₹5,000.00</CustomText>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <CustomText style={styles.statLabel}>
                  Total Orders Received
                </CustomText>
                <CustomText style={styles.statValue}>100</CustomText>
              </View>
              <View style={styles.statItem}>
                <CustomText style={styles.statLabel}>
                  Accepted Orders
                </CustomText>
                <CustomText style={styles.statValue}>89</CustomText>
              </View>
            </View>
          </View>

          {/* Profile Options */}
          <View style={styles.optionsContainer}>
            {profileOptions.map((option, index) => {
              const isLogout = (option as any).isLogout;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    index === profileOptions.length - 1 && styles.optionItemLast,
                    isLogout && styles.logoutOptionItem,
                  ]}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <CustomIcon
                      type={option.iconType}
                      name={option.icon}
                      size={22}
                      color={isLogout ? '#FF3B30' : COLORS.TEXT_PRIMARY}
                    />
                    <CustomText
                      style={[
                        styles.optionTitle,
                        isLogout && styles.logoutOptionTitle,
                      ]}
                    >
                      {option.title}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;
