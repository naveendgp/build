import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { COLORS } from "../../constants";
import { ICONS } from "../../constants/icons";
import { styles } from "./styles/locationStyles";
import SvgNotificationIcon from "../../assets/auto-generated-svg-icons/NotificationIcon";
import SvgLocationLine from "../../assets/auto-generated-svg-icons/LocationLine";
import LocationIcon from "../../assets/auto-generated-svg-icons/LocationIcon";
import { useNavigation } from "@react-navigation/native";
import { useProfile } from "../Profile/hooks/useProfile";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LocationHeader = () => {
  const navigation = useNavigation<Nav>();

  const {
    getDefaultAddressWithLabel,
  } = useProfile();

  const { label, address } = getDefaultAddressWithLabel();

  return (
    <View style={styles.container}>
      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <LocationIcon />
          <Text style={styles.locationText}>{label}</Text>
        </View>
        <Text style={styles.subText} numberOfLines={1}>{address}</Text>
      </View>

      <View style={styles.icons}>
        <TouchableOpacity
          onPressOut={() =>
            navigation.navigate('NotificationScreen')
          }
          style={[styles.iconContainer, styles.cartIcon]}>
          <SvgNotificationIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LocationHeader;


