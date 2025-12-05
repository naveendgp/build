import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
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
import { COLORS, FONTFAMILY } from '../../constants/colors';
import DiscardDialog from '../../components/DiscardDialog';
import SvgProfileIcon from '../../assets/auto-generated-svg-icons/ProfileIcon';
import SvgShopIcon from '../../assets/auto-generated-svg-icons/ShopIcon';
import SvgBankIcon from '../../assets/auto-generated-svg-icons/BankIcon';
import SvgServicesIcon from '../../assets/auto-generated-svg-icons/ServicesIcon';
import SvgStarIcon from '../../assets/auto-generated-svg-icons/StarIcon';
import SvgHelpSupportIcon from '../../assets/auto-generated-svg-icons/HelpSupportIcon';
import SvgHepSupportIcon from '../../assets/auto-generated-svg-icons/HepSupportIcon';
import SvgTermsConditionIcon from '../../assets/auto-generated-svg-icons/TermsConditionIcon';
import SvgLogoutIcon from '../../assets/auto-generated-svg-icons/LogoutIcon';
import SvgLogoutBlackIcon from '../../assets/auto-generated-svg-icons/LogoutBlackIcon';
import SvgSupportIcon from '../../assets/auto-generated-svg-icons/SupportIcon';
import SvgTagIcon from '../../assets/auto-generated-svg-icons/TagIcon';
import { openWhatsApp } from '../../utils/whatsappUtils';

export type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { logout, token, documentState } = useAuthStore();
  const { profile, isLoading } = useProfileStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const profileOptions = [
    {
      id: '1',
      title: 'Profile',
      icon: SvgProfileIcon,
      iconType: 'svg',
      onPress: () => navigation.navigate('ProfileDetails', { readOnly: true }),
    },
    {
      id: '2',
      title: 'Shop Details',
      icon: SvgShopIcon,
      iconType: 'svg',
      onPress: () => navigation.navigate('ShopDetails', { readOnly: true }),
    },
    {
      id: '3',
      title: 'Bank Details',
      icon: SvgBankIcon,
      iconType: 'svg',
      onPress: () => navigation.navigate('BankDetails', { readOnly: true }),
    },
    {
      id: '4',
      title: 'Services',
      icon: SvgServicesIcon,
      iconType: 'svg',
      onPress: () => navigation.navigate('Services'),
    },
    {
      id: '5',
      title: 'Item Pricing & Offer Details',
      icon: SvgTagIcon,
      iconType: 'svg',
      onPress: () => navigation.navigate('ActiveServicesPricingScreen'),
    },
    {
      id: '6',
      title: 'Shop Review',
      icon: SvgStarIcon,
      iconType: 'svg',
      onPress: () => navigation.navigate('ShopReviewsScreen'),
    },
    {
      id: '7',
      title: 'Help & support',
      icon: SvgSupportIcon,
      iconType: 'svg',
      onPress: () => openWhatsApp(profile?.support_phone_number || ''),
    },
    {
      id: '8',
      title: 'Privacy & Security',
      icon: SvgHepSupportIcon,
      iconType: 'svg',
      onPress: () => console.log('Privacy & Security'),
    },
    {
      id: '9',
      title: 'Terms & Condition',
      icon: SvgTermsConditionIcon,
      iconType: 'svg',
      onPress: () => console.log('Terms & Condition'),
    },
    {
      id: '10',
      title: 'Logout',
      icon: SvgLogoutBlackIcon,
      iconType: 'svg',
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
            <CustomText style={styles.summaryAmount}>{profile?.pending_settlement_amount}</CustomText>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <CustomText style={styles.statLabel}>
                  Total Orders Received
                </CustomText>
                <CustomText style={styles.statValue}>{profile?.total_orders}</CustomText>
              </View>
              <View style={styles.statItem}>
                <CustomText style={styles.statLabel}>
                  Accepted Orders
                </CustomText>
                <CustomText style={styles.statValue}>{profile?.total_accepted_orders}</CustomText>
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
                      name={option.icon as any}
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

      <DiscardDialog
        visible={showLogoutDialog}
        title="Logout"
        subtitle="Are you sure you want to logout?"
        primaryButtonText="Logout"
        secondaryButtonText="Cancel"
        onPrimaryButtonPress={handleConfirmLogout}
        onSecondaryButtonPress={handleCancelLogout}
        onClose={handleCancelLogout}
        closable={true}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
