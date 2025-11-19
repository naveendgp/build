import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right Icon (optional) */}
      {showRightIcon ? (
        <TouchableOpacity style={styles.iconButton} onPress={onRightIconPress}>
          <Text style={styles.rightIcon}>⋯</Text>
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
    
   
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1B2A4A',
    fontWeight: 'bold',
  },
  rightIcon: {
    fontSize: 20,
    color: '#1B2A4A',
    fontWeight: 'bold',
  },
  iconPlaceholder: {
    width: 32, // keeps layout aligned even if no icon
  },
  title: {
    flex: 1,
    textAlign: 'left',
    fontSize: 20,
    fontWeight: '600',
    color: '#1B2A4A',
    marginStart: 10,
  },
});
