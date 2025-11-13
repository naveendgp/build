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

type Props = {
  visible: boolean;
  onClose?: (e?: GestureResponderEvent) => void;
  title?: string;
  subtitle?: string;
  imageSource?: any;
  buttonText?: string;
  onButtonPress?: () => void;
  btnVisible?: boolean;
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
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          )}

          {title ? <CustomText style={styles.title}>{title}</CustomText> : null}

          {imageSource && (
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {subtitle ? (
            <CustomText style={styles.subtitle}>{subtitle}</CustomText>
          ) : null}

          {btnVisible && (
            <View style={styles.actionRow}>
              <CustomBtn
                title={buttonText}
                onPress={() => onButtonPress && onButtonPress()}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CustomeDialog;
