import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useNavigation } from '@react-navigation/native';
import OrdersScreen from '../screens/Orders';
import ProfileScreen from '../screens/Profile';
import SvgSelectedOrderIcon from '../assets/auto-generated-svg-icons/SelectedOrdersIcon';
import SvgUnselectedOrderIcon from '../assets/auto-generated-svg-icons/UnselectedOrdersIcon';
import SvgSelectedProfileIcon from '../assets/auto-generated-svg-icons/SelectedProfileIcon';
import SvgUnselectedProfileIcon from '../assets/auto-generated-svg-icons/UnselectedProfileIcon';
import { getProfile } from '../apiService/api/profileApi';
import { ProfileResponse } from '../apiService/types/profileTypes';
import { ErrorResponse } from '../apiService/types/authTypes';
import { useProfileStore } from '../apiService/store/useProfileStore';
import { useAuthStore } from '../apiService/store/useAuthStore';
import { useDialogStore } from '../apiService/store/useDialogStore';
import { showErrorToast } from '../utils/Toast';
import ServiceAddedDialog from '../screens/Services/ServiceAddedDialog';
import { LoginUserStatus } from '../constants/tripStatus';
import CustomeDialog from '../components/Dialog';
import { compareVersions, getCurrentAppVersion, openAppStore } from '../utils/appVersionUtils';
import { Platform } from 'react-native';

export type BottomTabParamList = {
  Home: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Custom tab bar icon component
const TabBarIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const getIcon = () => {
    switch (name) {

      case 'Orders':
        return focused
          ? <SvgSelectedOrderIcon />
          : <SvgUnselectedOrderIcon />;
      case 'Profile':
        return focused
          ? <SvgSelectedProfileIcon />
          : <SvgUnselectedProfileIcon />;
      default:
        return <Text style={{ fontSize: 24 }}>•</Text>;
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {getIcon()}
    </View>
  );
};

const BottomTabNavigator = () => {
  const { setProfile, setError, setLoading } = useProfileStore();
  const { setDocumentState, setIsLoggedIn } = useAuthStore();
  const showDialog = useDialogStore(state => state.showDialog);
  const hideDialog = useDialogStore(state => state.hideDialog);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showForceUpdateDialog, setShowForceUpdateDialog] = useState(false);
  const navigation = useNavigation<any>();


  const handleRestrictedStatus = useCallback(() => {
    showDialog(
      'Account Status',
      'Your account status requires attention. Please log in again.',
      'Go to Login',
      require('../assets/background/bg.png'),
      () => {
        hideDialog();
        setIsLoggedIn(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
      false,
    );
  }, [hideDialog, navigation, setIsLoggedIn, showDialog]);

  const handleForceUpdate = useCallback(() => {
    setShowForceUpdateDialog(true);
  }, []);

  const handleUpdateButtonPress = useCallback(() => {
    openAppStore();
  }, []);

  // Fetch profile data when entering the application
  const { data, error, isLoading } = useQuery<
    ProfileResponse,
    AxiosError<ErrorResponse>
  >({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  // Update loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Handle profile data and update store
  useEffect(() => {
    if (data) {
      setProfile(data.data);

      // Check for force update
      if (data.data.app_version) {
        const appVersion = data.data.app_version;
        // Check if the app_type matches the current platform
        const currentPlatform = Platform.OS === 'ios' ? 'vendor_ios' : 'vendor_android';

        if (appVersion.app_type === currentPlatform) {
          const currentVersion = getCurrentAppVersion();
          const serverVersion = appVersion.version;

          console.log('appVersion---------------------------------------------------------');
          console.log('currentVersion', currentVersion);
          console.log('serverVersion', serverVersion);


          const versionComparison = compareVersions(currentVersion, serverVersion);

          // Check if force update is required
          // Only show force update dialog if:
          // 1. is_forceupdate is true AND
          // 2. Current version is less than server version
          // This ensures that once user updates, dialog won't show again even if is_forceupdate is still true
          if (appVersion.is_forceupdate && versionComparison < 0) {
            // Force update is enabled and current version is outdated
            handleForceUpdate();
          }
          // If versionComparison >= 0, user has updated to required version, so no dialog needed
        }
      }

      // Update document state from profile status
      if (data.data.status) {
        const status = data.data.status as LoginUserStatus;
        setDocumentState(status);
        if (status === LoginUserStatus.ACTIVE) {
          setShowReviewDialog(false);
        } else if (status === LoginUserStatus.DOC_UNDER_REVIEW) {
          setShowReviewDialog(true);
        } else {
          setShowReviewDialog(false);
          handleRestrictedStatus();  // uncmd
        }
      }
    }
    if (error) {
      const msg = error.response?.data?.message || error.message;
      setError(msg);
      showErrorToast(msg);
    }
  }, [data, error, setProfile, setError, setDocumentState, handleRestrictedStatus, handleForceUpdate]);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: '#1B2A4A',
          tabBarInactiveTintColor: '#7B869A',
          tabBarStyle: {
            backgroundColor: '#F6F6F6',
            height: 60,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
        })}
      >

        <Tab.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            tabBarLabel: 'Orders',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
      <ServiceAddedDialog
        visible={showReviewDialog}
        onClose={() => { }}
      />
      <CustomeDialog
        visible={showForceUpdateDialog}
        title="Update Required"
        subtitle="A new version of the app is available. Please update to continue using the app."
        buttonText="Update Now"
        onButtonPress={handleUpdateButtonPress}
        closable={false}
        btnVisible={true}
      />
    </>
  );
};

export default BottomTabNavigator;
