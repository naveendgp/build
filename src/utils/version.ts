import { Platform, Linking, NativeModules } from 'react-native';

/**
 * Gets the current app version from native modules (if available) with a safe fallback.
 */
export const getCurrentAppVersion = (): string => {
  try {
    if (NativeModules.RNDeviceInfo?.getVersion) {
      return NativeModules.RNDeviceInfo.getVersion() || '1.0.0';
    }
    return '1.0.0';
  } catch (error) {
    console.warn('Could not get app version, using default:', error);
    return '1.0.0';
  }
};

/**
 * Compares two semver-like version strings.
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
 * Opens the appropriate app store for this app.
 */
export const openAppStore = async (appId?: string) => {
  try {
    let url = '';
    if (Platform.OS === 'ios') {
      // App Store
      const bundleId = appId || 'com.otter.laundryuserapp';
      url = `https://apps.apple.com/app/id${bundleId}`;
      const itmsUrl = `itms-apps://apps.apple.com/app/id${bundleId}`;
      const canOpen = await Linking.canOpenURL(itmsUrl);
      if (canOpen) {
        await Linking.openURL(itmsUrl);
        return;
      }
    } else {
      // Play Store
      const packageName = appId || 'com.otter.laundryuserapp';
      url = `https://play.google.com/store/apps/details?id=${packageName}`;
      const marketUrl = `market://details?id=${packageName}`;
      const canOpen = await Linking.canOpenURL(marketUrl);
      if (canOpen) {
        await Linking.openURL(marketUrl);
        return;
      }
    }

    await Linking.openURL(url);
  } catch (error) {
    console.error('Error opening app store:', error);
  }
};

