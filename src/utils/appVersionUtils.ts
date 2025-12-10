import { Platform, Linking, NativeModules } from 'react-native';

/**
 * Gets the current app version
 * @returns The app version string (e.g., "1.0.0")
 */
export const getCurrentAppVersion = (): string => {
    try {
        // Try to get version from NativeModules (if react-native-device-info is installed)
        if (NativeModules.RNDeviceInfo) {
            return NativeModules.RNDeviceInfo.getVersion() || '1.0.0';
        }

        // Fallback: Try to get from Constants (Expo) or other methods
        // For bare React Native, you may need to install react-native-device-info
        // or create a native module to get the version
        // For now, return a default version
        // In production, install: npm install react-native-device-info
        return '1.0.0';
    } catch (error) {
        // Fallback: return a default version
        console.warn('Could not get app version, using default:', error);
        return '1.0.0';
    }
};

/**
 * Compares two version strings
 * @param currentVersion - Current app version (e.g., "1.0.0")
 * @param serverVersion - Server version (e.g., "1.0.1")
 * @returns -1 if current < server, 0 if equal, 1 if current > server
 */
export const compareVersions = (currentVersion: string, serverVersion: string): number => {
    const current = currentVersion.split('.').map(Number);
    const server = serverVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, server.length); i++) {
        const currentPart = current[i] || 0;
        const serverPart = server[i] || 0;

        if (currentPart < serverPart) return -1;
        if (currentPart > serverPart) return 1;
    }

    return 0;
};

/**
 * Opens the app store (iOS) or play store (Android) for the app
 * @param appId - The app ID (bundle identifier for iOS, package name for Android)
 */
export const openAppStore = async (appId?: string) => {
    try {
        let url = '';

        if (Platform.OS === 'ios') {
            // iOS App Store URL
            const bundleId = appId || 'com.otter.laundryvendorapp';
            url = `https://apps.apple.com/app/id${bundleId}`;
            // Alternative: itms-apps:// scheme (opens App Store app directly)
            const itmsUrl = `itms-apps://apps.apple.com/app/id${bundleId}`;
            const canOpen = await Linking.canOpenURL(itmsUrl);
            if (canOpen) {
                await Linking.openURL(itmsUrl);
                return;
            }
        } else {
            // Android Play Store URL
            const packageName = appId || 'com.otter.laundryvendorapp';
            url = `https://play.google.com/store/apps/details?id=${packageName}`;
            // Alternative: market:// scheme (opens Play Store app directly)
            const marketUrl = `market://details?id=${packageName}`;
            const canOpen = await Linking.canOpenURL(marketUrl);
            if (canOpen) {
                await Linking.openURL(marketUrl);
                return;
            }
        }

        // Fallback to web URL
        await Linking.openURL(url);
    } catch (error) {
        console.error('Error opening app store:', error);
    }
};

