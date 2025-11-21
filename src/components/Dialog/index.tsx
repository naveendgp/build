import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  GestureResponderEvent,
} from 'react-native';
import styles from './styles';
import CustomBtn from '../CustomBtn';
import CustomText from '../Text';
import { COLORS } from '../../constants';

type Props = {
  visible: boolean;
  onClose?: (e?: GestureResponderEvent) => void;
  title?: string;
  subtitle?: string;
  imageSource?: any;
  buttonText?: string;
  onButtonPress?: () => void;
  btnVisible?: boolean;
  closable?: boolean; // If false, dialog cannot be closed by tapping outside or close button
};

const CustomeDialog: React.FC<Props> = ({
  visible,
  onClose,
  title,
  subtitle,
  imageSource,
  buttonText = 'OK',
  onButtonPress,
  btnVisible = true,
  closable = true, // Default to closable
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closable ? onClose : undefined} // Prevent back button on Android if not closable
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={closable ? onClose : undefined} // Prevent closing on overlay tap if not closable
      >
        <View
          style={styles.container}
          onStartShouldSetResponder={() => true}
        >
          {onClose && closable && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          )}

          {/* Image/Icon Container */}
          {imageSource && (
            <View style={styles.iconContainer}>
              <Image
                source={imageSource}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Title */}
          {title ? <CustomText style={styles.title}>{title}</CustomText> : null}

          {/* Subtitle */}
          {subtitle ? (
            <CustomText style={styles.subtitle}>{subtitle}</CustomText>
          ) : null}

          {/* Button */}
          {btnVisible && (
            <View style={styles.actionRow}>
              <CustomBtn
                title={buttonText}
                onPress={() => onButtonPress && onButtonPress()}
                style={{ backgroundColor: COLORS.ONBOARDING_BUTTON }}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default CustomeDialog;
