import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Toolbar from '../../../components/Toolbar';
import { COLORS } from '../../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

type WebViewScreenRouteProp = RouteProp<RootStackParamList, 'WebViewScreen'>;
type WebViewScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'WebViewScreen'>;

const WebViewScreen: React.FC = () => {
    const route = useRoute<WebViewScreenRouteProp>();
    const navigation = useNavigation<WebViewScreenNavProp>();
    const { url, title } = route.params;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Toolbar title={title || 'Web View'} onBackPress={() => navigation.goBack()} />
            <WebView
                source={{ uri: url }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.WHITE,
    },
});

export default WebViewScreen;

