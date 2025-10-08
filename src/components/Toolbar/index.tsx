import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ToolbarProps {
  title: string;
  showRightIcon?: boolean;
  rightIconName?: string;
  onRightIconPress?: () => void;
  onBackPress?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  title,
  showRightIcon = false,
  rightIconName = 'ellipsis-vertical',
  onRightIconPress,
  onBackPress,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onBackPress || (() => navigation.goBack())}
      >
        <Ionicons name="chevron-back" size={26} color="#000" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right Icon (optional) */}
      {showRightIcon ? (
        <TouchableOpacity style={styles.iconButton} onPress={onRightIconPress}>
          <Ionicons name={rightIconName} size={22} color="#000" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
};

export default Toolbar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    elevation: 1,
  },
  iconButton: {
    padding: 8,
  },
  iconPlaceholder: {
    width: 32, // keeps layout aligned even if no icon
  },
  title: {
    flex: 1,
    textAlign: 'left',
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginStart: 10,
  },
});
