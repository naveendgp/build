import React from "react";
import { View, TouchableOpacity } from "react-native";
import CustomText from "../../../components/Text";
import CustomBtn from "../../../components/CustomBtn";
import styles from "../style";

interface ProfileCardProps {
  initials: string;
  name?: string;
  phone: string;
  email?: string;
  address: string;
  label: string;
  onEditPress: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  initials,
  name,
  phone,
  email,
  address,
  label,
  onEditPress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.avatarCircle}>
        <CustomText style={styles.avatarInitials}>{initials}</CustomText>
      </View>

      <CustomText style={styles.name}>{name}</CustomText>
      <CustomText style={styles.phone}>{phone}</CustomText>

      <CustomText style={styles.sectionLabel}>Mail ID</CustomText>
      <CustomText style={styles.sectionValue}>{email || "-"}</CustomText>

      <CustomText style={[styles.sectionLabel]}>{label}</CustomText>
      <CustomText numberOfLines={2} style={styles.sectionValue}>
        {address}
      </CustomText>

      <CustomBtn
        title="Edit Profile"
        onPress={onEditPress}
        variant="outline"
        style={styles.editBtn}
        textStyle={styles.editBtnText}
      />
    </View>
  );
};

export default ProfileCard;