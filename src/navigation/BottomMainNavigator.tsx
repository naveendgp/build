import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICONS } from "../constants/icons";
import { COLORS } from "../constants/colors";
import { SvgXml } from "react-native-svg";
import { HomeScreen } from "../screens/Home/HomeScreen";
import ProfileScreen from "../screens/Profile";
import SvgSelectedHomeIcon from "../assets/auto-generated-svg-icons/SelectedHomeIcon";
import SvgUnselectedProfileIcon from "../assets/auto-generated-svg-icons/UnselectedProfileIcon";
import SvgSelectedProfileIcon from "../assets/auto-generated-svg-icons/SelectedProfileIcon";
import SvgUnselectedHomeIcon from "../assets/auto-generated-svg-icons/UnselectedHomeIcon";
import SvgSelectedOrderIcon from "../assets/auto-generated-svg-icons/SelectedOrdersIcon";
import SvgUnselectedOrderIcon from "../assets/auto-generated-svg-icons/UnselectedOrdersIcon";
import OrdersScreen from "../screens/Orders";
import { FONTFAMILY } from "../constants";


const Tab = createBottomTabNavigator();




const BottomMainNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused }: any) => {
          let IconSource: any = null;
          if (route.name === "Home") {
            IconSource = focused ? SvgSelectedHomeIcon : SvgUnselectedHomeIcon;
          } else if (route.name === "Orders") {
            IconSource = focused
              ? SvgSelectedOrderIcon
              : SvgUnselectedOrderIcon;
          } else if (route.name === "Profile") {
            IconSource = focused
              ? SvgSelectedProfileIcon
              : SvgUnselectedProfileIcon;
          }

          return (
            <View style={styles.iconContainer}>
              {IconSource && <IconSource width={24} height={24} />}
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.THEME_GREEN,
        tabBarInactiveTintColor: COLORS.BOTTOM_BLACK,
        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === 'ios' ? 88 : 80 + insets.bottom,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8 + insets.bottom,
          }
        ],
        headerShown: false,
        tabBarLabel: ({ focused }: any) => (
          <Text
            style={[
              focused ? styles.activeLabel : styles.inactiveLabel,
            ]}
          >
            {route.name}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
  },
  activeLabel: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.THEME_GREEN,
    fontWeight: "400",
    fontFamily: FONTFAMILY.INTER_REGULAR
  },

  inactiveLabel: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.BOTTOM_BLACK,
    fontWeight: "400",
  },
  tabBar: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY_2,
    height: 80,
    paddingBottom: 8,
    paddingTop: 8,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 24,
  },
  iconTextActive: {
    color: COLORS.PRIMARY,
  },
});

export default BottomMainNavigator;
