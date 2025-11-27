import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../screens/Home';
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
import { isNetworkAvailable } from '../utils/network';

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
  }, [data, error, setProfile, setError, setDocumentState, handleRestrictedStatus]);

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
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
            height: 60,

            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
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
    </>
  );
};

export default BottomTabNavigator;
