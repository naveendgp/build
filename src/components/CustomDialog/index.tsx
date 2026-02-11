import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants'; // Adjust based on your path

const { width } = Dimensions.get('window');

interface CustomDialogProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
  onConfirm: () => void;
  showSingleBtn?: boolean; // if true, shows only one button and disables outside close
  confirmText?: string;
  cancelText?: string;
  isRed?: boolean;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  title,
  content,
  onClose,
  onConfirm,
  showSingleBtn = false,
  confirmText = 'OK',
  cancelText = 'Cancel',
  isRed = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleOutsidePress = () => {
    if (!showSingleBtn) {
      onClose();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dialogContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{content}</Text>

              <View style={styles.buttonRow}>
                {showSingleBtn ? (
                  <TouchableOpacity style={styles.singleBtn} onPress={onConfirm}>
                    <Text style={styles.singleBtnText}>{confirmText}</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                      <Text style={styles.cancelText}>{cancelText}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.confirmBtn, isRed && { backgroundColor: COLORS.RED }]} onPress={onConfirm}>
                      <Text style={styles.confirmText}>{confirmText}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CustomDialog;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    color: COLORS.BLACK,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.ACCENT,
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: '#fff',
    fontSize: 14,
  },
  singleBtn: {
    flex: 1,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  singleBtnText: {
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: '#fff',
    fontSize: 14,
  },
});
