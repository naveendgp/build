import React from "react";
import { View, TouchableOpacity } from "react-native";
import CustomText from "../../../components/Text";
import SvgSupportIcon from "../../../assets/auto-generated-svg-icons/SupportIcon";
import SvgPrivacyPolicyIcon from "../../../assets/auto-generated-svg-icons/PrivacyPolicyIcon";
import SvgTermsConditionIcon from "../../../assets/auto-generated-svg-icons/TermsConditionIcon";
import styles from "../style";

interface SupportListProps {
  onSupportPress?: () => void;
  onPrivacyPress?: () => void;
  onTermsPress?: () => void;
  onInvoicePress?: () => void;
}

const SupportList: React.FC<SupportListProps> = ({
  onSupportPress,
  onPrivacyPress,
  onTermsPress,
  onInvoicePress,
}) => {
  return (
    <View style={styles.list}>
      <TouchableOpacity style={styles.listItem} onPress={onSupportPress}>
        <View style={styles.listLeft}>
          <SvgSupportIcon />
          <CustomText style={styles.listText}>Help & support</CustomText>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.listItem} onPress={onPrivacyPress}>
        <View style={styles.listLeft}>
          <SvgPrivacyPolicyIcon />
          <CustomText style={styles.listText}>Privacy & Security</CustomText>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.listItem} onPress={onTermsPress}>
        <View style={styles.listLeft}>
          <SvgTermsConditionIcon />
          <CustomText style={styles.listText}>Terms & Condition</CustomText>
        </View>
      </TouchableOpacity>
      {/* <TouchableOpacity style={styles.listItem} onPress={onInvoicePress}>
        <View style={styles.listLeft}>
          <SvgTermsConditionIcon />
          <CustomText style={styles.listText}>Invoice</CustomText>
        </View>
      </TouchableOpacity> */}
    </View>
  );
};

export default SupportList;