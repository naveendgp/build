import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, StyleProp, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { COLORS, FONTFAMILY } from "../../constants";
import BackIcon from "../../assets/auto-generated-svg-icons/BackIcon";
import SvgBackArrowIcon from "../../assets/auto-generated-svg-icons/BackArrowIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ToolbarProps {
  title: string;
  showBackIcon?: boolean;
  showRightIcon?: boolean;
  rightIconName?: string;
  onRightIconPress?: () => void;
  onBackPress?: () => void;
  showLocation?: boolean;
  onLocationPress?: () => void;
  location?: {
    label: string;
    address: string;
  };
  style?: StyleProp<ViewStyle>;
}

const Toolbar: React.FC<ToolbarProps> = ({
  title,
  showRightIcon = false,
  rightIconName = "ellipsis-vertical",
  onRightIconPress,
  showBackIcon = true,
  onBackPress,
  showLocation = false,
  location = { label: "", address: "" },
  onLocationPress,
  style,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[toolbarStyles.container, style, { paddingTop: insets.top }]}>
      {/* Back Button */}
      {showBackIcon ? (<TouchableOpacity
        style={toolbarStyles.iconButton}
        onPress={onBackPress || (() => navigation.goBack())}
      >
        <SvgBackArrowIcon />

      </TouchableOpacity>) : (<View></View>)}

      {/* Title and Location Container */}
      <View style={toolbarStyles.titleContainer}>
        <Text style={toolbarStyles.title}>{title}</Text>
        {showLocation && location && (
          <TouchableOpacity
            style={toolbarStyles.locationContainer}
            onPress={onLocationPress}
            activeOpacity={0.7}
          >
            <Text style={toolbarStyles.locationHeader}>{location.label} - </Text>
            <Text style={toolbarStyles.locationText} numberOfLines={1}>{location.address}</Text>

          </TouchableOpacity>
        )}
      </View>

      {/* Right Icon (optional) */}
      {showRightIcon ? (
        <TouchableOpacity
          style={toolbarStyles.iconButton}
          onPress={onRightIconPress}
        >
          <Ionicons name={rightIconName} size={22} color="#000" />
        </TouchableOpacity>
      ) : (
        <View style={toolbarStyles.iconPlaceholder} />
      )}
    </View>
  );
};

export default Toolbar;

export const toolbarStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconPlaceholder: {
    width: 32, // keeps layout aligned even if no icon
  },
  titleContainer: {
    flex: 1,
    marginStart: 8,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    maxWidth: '90%',
    overflow: 'hidden',
    fontSize: 12,
    color: COLORS.NOTE_TEXT,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontWeight: "400",
  },
  locationHeader: {
    fontSize: 12,
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontWeight: "600",
  },
});
