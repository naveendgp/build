import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    StyleSheet,
    Modal,
} from 'react-native';
import { COLORS, FONTFAMILY } from '../../constants';

const { height: screenHeight } = Dimensions.get('window');


interface ToastOptions {
    msg: string;
    bgColor?: string;
    textColor?: string;
    isShowCancel?: boolean;
    textStyle?: object;
    dismissDuration?: number;
    autoDismiss?: boolean;
}

type ToastInternal = ToastOptions & { id: number };

// ---- Global Toast Manager ---- //
let globalToastRef: ((options: ToastOptions) => void) | null = null;
const toastQueue: ToastInternal[] = [];
let lastMessage = ''; // prevent duplicate same message

interface CustomToastComponent extends React.FC {
    show: (options: ToastOptions) => void;
}

// ---- Component ---- //
const CustomToast: CustomToastComponent = () => {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<ToastInternal | null>(null);
    const slideAnim = useRef(new Animated.Value(-200)).current; // Start from above screen

    // Mount global reference
    useEffect(() => {
        globalToastRef = (opts: ToastOptions) => {
            // Allow duplicate messages for now to ensure visibility during debugging/retry
            // if (opts.msg.trim() === lastMessage.trim()) {
            //     return;
            // }

            lastMessage = opts.msg;

            const newToast: ToastInternal = { ...opts, id: Date.now() };
            toastQueue.push(newToast);
            if (!visible) {
                showNextToast();
            }
        };

        return () => {
            globalToastRef = null;
        };
    }, [visible]);

    const showNextToast = () => {
        if (toastQueue.length === 0) {
            lastMessage = '';
            return;
        }

        const nextToast = toastQueue.shift();
        if (!nextToast) return;

        setOptions(nextToast);
        // Reset animation value before showing
        slideAnim.setValue(-200);
        setVisible(true);

        // Small delay to ensure Modal is mounted before animating
        setTimeout(() => {
            // Slide in
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }, 100); // Increased delay to 100ms to ensure Modal is ready

        if (nextToast.autoDismiss !== false) {
            setTimeout(() => {
                hideToast();
            }, nextToast.dismissDuration || 2500);
        }
    };

    const hideToast = () => {
        Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            setOptions(null);
            // Wait a short delay before showing next to avoid overlap
            setTimeout(showNextToast, 250);
        });
    };

    if (!visible || !options) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            statusBarTranslucent={true}
            hardwareAccelerated={true}
            onRequestClose={hideToast}
            presentationStyle="overFullScreen"
        >
            <View style={styles.modalContainer} pointerEvents="box-none">
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: options.bgColor || COLORS.BLACK,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                    pointerEvents="auto"
                >
                    <View style={styles.content}>
                        <Text
                            style={[
                                styles.text,
                                { color: options.textColor || COLORS.WHITE },
                                options.textStyle,
                            ]}
                        >
                            {options.msg}
                        </Text>
                        {options.isShowCancel && (
                            <TouchableOpacity onPress={hideToast} style={styles.cancelButton}>
                                <Text
                                    style={[
                                        styles.cancelIcon,
                                        { color: options.textColor || COLORS.WHITE },
                                    ]}
                                >
                                    ×
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

// ---- Global static show() ---- //
CustomToast.show = (options: ToastOptions) => {
    if (globalToastRef) {
        globalToastRef(options);
    } else {
        // Cache early calls until component mounts
        setTimeout(() => {
            if (globalToastRef) globalToastRef(options);
        }, 200);
    }
};



// ---- Styles ---- //
const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 50,
    },
    container: {
        width: '95%',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        elevation: 9999, // Very high elevation for Android to appear above Modal
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 99999, // Very high z-index for iOS to appear above Modal
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '95%',
    },
    text: {
        flex: 1,
        marginRight: 16,
        fontWeight: '500',
        fontFamily: FONTFAMILY.INTER_MEDIUM,
        fontSize: 16,
    },
    cancelButton: {
        padding: 6,
    },
    cancelIcon: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default CustomToast;
