import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import HomeScreen from '../screens/Home';
import OrdersScreen from '../screens/Orders';
import ProfileScreen from '../screens/Profile';
import SvgSelectedOrderIcon from '../assets/auto-generated-svg-icons/SelectedOrdersIcon';
import SvgUnselectedOrderIcon from '../assets/auto-generated-svg-icons/UnselectedOrdersIcon';
import SvgSelectedProfileIcon from '../assets/auto-generated-svg-icons/SelectedProfileIcon';
import SvgUnselectedProfileIcon from '../assets/auto-generated-svg-icons/UnselectedProfileIcon';

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
  return (
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
  );
};

export default BottomTabNavigator;
