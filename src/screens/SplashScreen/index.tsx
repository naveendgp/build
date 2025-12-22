import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../apiService/store/useAuthStore';
import { LoginUserStatus } from '../../constants/tripStatus';
import { COLORS } from '../../constants/colors';
import styles from './style';
import BackgroundGradient from '../../components/backgroundGradient';
import OtterLogo from '../../assets/auto-generated-svg-icons/OtterWhite';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>();
    const isLoggedIn = useAuthStore(state => state.isLoggedIn);
    const documentState = useAuthStore(state => state.documentState);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Animate logo
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate after splash delay
        const timer = setTimeout(() => {
            navigateToScreen();
        }, 2000); // 2 seconds splash screen

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const navigateToScreen = () => {
        console.log("isLoggedIn", isLoggedIn);
        console.log("documentState", documentState);
        if (!isLoggedIn) {
            navigation.replace('Login');
            return;
        }

        // If logged in, check document state
        switch (documentState) {
            case LoginUserStatus.ACTIVE:
            case LoginUserStatus.DOC_UNDER_REVIEW:
                navigation.replace('MainTabs');
                break;

            case LoginUserStatus.DOC_PENDING_UPLOAD:
            case LoginUserStatus.DOC_REUPLOAD_REQUIRED:
                navigation.replace('VendorVerification');
                break;

            case LoginUserStatus.INACTIVE:
            case LoginUserStatus.BLOCKED:
            default:
                navigation.replace('Login');
                break;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <OtterLogo tintColor={COLORS.WHITE} />

        </View>
    );
};

export default SplashScreen;

