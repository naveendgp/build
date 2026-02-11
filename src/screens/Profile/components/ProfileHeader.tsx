import React from "react";
import { View, TouchableOpacity } from "react-native";
import CustomText from "../../../components/Text";
import NotificationIcon from "../../../assets/auto-generated-svg-icons/NotificationIcon";
import styles from "../style";

interface ProfileHeaderProps {
  onNotificationPress: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onNotificationPress }) => {
  return (
    <View style={styles.headerRow}>
      <CustomText style={styles.headerTitle}>Profile & Support</CustomText>
      <TouchableOpacity style={styles.bellBtn} onPress={onNotificationPress}>
        <NotificationIcon />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileHeader;