import React from "react";
import { TouchableOpacity, View } from "react-native";
import CustomText from "../../../components/Text";
import SvgLogoutIcon from "../../../assets/auto-generated-svg-icons/LogoutIcon";
import styles from "../style";

interface LogoutButtonProps {
  onPress: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.logoutRow} onPress={onPress}>
      <View style={styles.logoutLeft}>
        <SvgLogoutIcon />
        <CustomText style={styles.logoutText}>Log Out</CustomText>
      </View>
    </TouchableOpacity>
  );
};

export default LogoutButton;