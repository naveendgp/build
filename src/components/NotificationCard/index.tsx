import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants';
import { theme } from '../../utils';
import CustomText from '../Text';
import styles from './styles';

interface NotificationCardProps {
  title: string;
  message: string;
  timestamp: Date;
  onPress?: () => void;
  isRead?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  message,
  timestamp,
  onPress,
  isRead = false,
}) => {
  const formattedTime = timestamp.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' • ' + timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isRead && styles.readContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <CustomText
            style={[
              styles.title,
              isRead && styles.readTitle,
            ]}
          >
            {title}
          </CustomText>
          <CustomText style={styles.time}>
            {formattedTime}
          </CustomText>
        </View>
        <CustomText
          style={[
            styles.message,
            isRead && styles.readMessage,
          ]}
        >
          {message}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
};


export default NotificationCard;
