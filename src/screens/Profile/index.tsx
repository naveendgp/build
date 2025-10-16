import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import CustomText from '../../components/Text';
import styles from './styles.ts';
import { useAuthStore } from '../../apiService/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { logout, token, documentState } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
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
      ]
    );
  };

  const profileOptions = [
    {
      id: '1',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: '👤',
      onPress: () => console.log('Edit Profile'),
    },
    {
      id: '2',
      title: 'Business Settings',
      subtitle: 'Manage your business details',
      icon: '🏪',
      onPress: () => console.log('Business Settings'),
    },
    {
      id: '3',
      title: 'Notification Settings',
      subtitle: 'Configure your notifications',
      icon: '🔔',
      onPress: () => console.log('Notification Settings'),
    },
    {
      id: '4',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: '❓',
      onPress: () => console.log('Help & Support'),
    },
    {
      id: '5',
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
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.title}>Profile</CustomText>
        <CustomText style={styles.subtitle}>Manage your account</CustomText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <CustomText style={styles.avatarText}>VD</CustomText>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <CustomText style={styles.profileName}>Vendor Name</CustomText>
            <CustomText style={styles.profileEmail}>vendor@example.com</CustomText>
            <View style={[styles.statusBadge, { backgroundColor: getDocumentStatusColor() }]}>
              <CustomText style={styles.statusText}>{getDocumentStatusText()}</CustomText>
            </View>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <CustomText style={styles.optionIcon}>{option.icon}</CustomText>
                <View style={styles.optionTextContainer}>
                  <CustomText style={styles.optionTitle}>{option.title}</CustomText>
                  <CustomText style={styles.optionSubtitle}>{option.subtitle}</CustomText>
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
    </View>
  );
};

export default ProfileScreen;
