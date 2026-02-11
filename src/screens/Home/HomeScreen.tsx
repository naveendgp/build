import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { theme } from "../../utils/theme";
import { COLORS } from "../../constants/colors";
import LinearGradient from "react-native-linear-gradient";
import LocationHeader from "./locationComp.tsx";
import LaundryPickupComponent from "./LaundryPickupComponent ";
import LaundryServiceCard from "./LaundryServiceCard";
import { useServicesStore } from "../../state/zustand/servicesStore";
import { useVendorsStore } from "../../state/zustand/vendorsStore";
import CustomSkeleton from "../../components/CustomSkeleton";
import { styles } from "./styles/homeScreenStyles.ts";
import BackgroundGradient from "../../components/backgroundGradient";
import ErrorState from "../../components/ErrorState";
import { getErrorMessageFromMultiple } from "../../utils/errorUtils";
import { useCommonStore } from "../../state/zustand/commonStore";
import { useDialogStore } from "../../components/SessionHandler/dialogStore";
import { compareVersions, getCurrentAppVersion, openAppStore } from "../../utils/version";
import { SvgUri } from 'react-native-svg';

export const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { services, isLoading: servicesLoading, error: servicesError, getServices, clearError: clearServicesError } =
    useServicesStore();
  const { vendors, isLoading: vendorsLoading, error: vendorsError, getVendors, clearError: clearVendorsError } =
    useVendorsStore();
  const { profile, getProfile } = useCommonStore();
  const { showDialog } = useDialogStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerFlatListRef = useRef<FlatList>(null);
  const bannerScrollInterval = useRef<number | null>(null);
  const [hasCheckedForceUpdate, setHasCheckedForceUpdate] = useState(false);

  useEffect(() => {
    getServices();
    getVendors({
      sort: [],
      isExpress: null,
      isOffer: null,
      serviceFilters: []
    });

    getProfile();

    // Start banner auto-scroll when component mounts
    startBannerAutoScroll();

    return () => {
      // Cleanup interval on unmount
      if (bannerScrollInterval.current) {
        clearInterval(bannerScrollInterval.current);
      }
    };
  }, []);

  // Clear errors when screen comes into focus to prevent stale errors from showing
  // This prevents showing error state after successful profile refresh
  useFocusEffect(
    React.useCallback(() => {
      // Clear any stale errors when screen comes into focus
      // This ensures that if profile refresh was successful, we don't show stale service/vendor errors
      if (servicesError) {
        clearServicesError();
      }
      if (vendorsError) {
        clearVendorsError();
      }
    }, [servicesError, vendorsError, clearServicesError, clearVendorsError])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await getServices();
    await getVendors({
      sort: [],
      isExpress: null,
      isOffer: null,
      serviceFilters: []
    });
    setRefreshing(false);
  };


  // Banner auto-scroll functionality
  const startBannerAutoScroll = () => {
    if (bannerScrollInterval.current) {
      clearInterval(bannerScrollInterval.current);
    }

    bannerScrollInterval.current = setInterval(() => {
      if (services?.data?.banners && services.data.banners.length > 0) {
        const nextIndex = (currentBannerIndex + 1) % services.data.banners.length;
        setCurrentBannerIndex(nextIndex);

        bannerFlatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 3000); // 3 seconds interval as requested
  };

  const handleBannerScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentBannerIndex(roundIndex);
  };

  useEffect(() => {
    if (hasCheckedForceUpdate) return;
    if (!profile?.app_version || profile.app_version.length === 0) return;

    const currentPlatform = Platform.OS === "ios" ? "user_ios" : "user_android";
    const platformVersion = profile.app_version.find((entry) => entry.app_type === currentPlatform);


    if (!platformVersion) return;

    const currentVersion = getCurrentAppVersion();
    const versionComparison = compareVersions(currentVersion, platformVersion.version);



    if (platformVersion.is_forceupdate && versionComparison < 0) {
      showDialog({
        title: "Update Required",
        content: "A new version of the app is available. Please update to continue.",
        showSingleBtn: true,
        onConfirm: () => {
          openAppStore();
        }
      });
      setHasCheckedForceUpdate(true);
    }
  }, [profile, hasCheckedForceUpdate, showDialog]);

  const renderBannerItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.bannerItemContainer}>
      {servicesLoading ? (
        <CustomSkeleton
          width={Dimensions.get('window').width * 0.9}
          height={140}
          borderRadius={12}
        />
      ) : (
        <Image
          source={{ uri: item?.asseturl }}
          resizeMode="cover"
          style={[styles.bannerImage]}
          onError={(error) => {
            console.log('Banner image load error:', error);
          }}
        />
      )}
    </View>
  );

  const renderPaginationDots = () => {
    if (!services?.data?.banners || services.data.banners.length <= 1) {
      return null;
    }

    return (
      <View style={styles.paginationContainer}>
        {services.data.banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentBannerIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  if (refreshing) {
    return (
      <View style={{ flex: 1 }}>

        <BackgroundGradient />
        <View

          style={styles.container}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
          </View>
        </View>

      </View>
    );
  }

  const handleRetry = () => {
    clearServicesError();
    clearVendorsError();
    getServices();
    getVendors({
      sort: [],
      isExpress: null,
      isOffer: null,
      serviceFilters: []
    });
  };


  if (servicesError || vendorsError) {
    return (

      <ErrorState
        message={getErrorMessageFromMultiple([servicesError, vendorsError])}
        onRetry={handleRetry}
      />

    );
  }

  return (
    // <LinearGradient
    //   colors={['#6cbf86', '#FFFFFF']}
    //   start={{ x: 0.25, y: 0 }}
    //   end={{ x: 0.5, y: 0.65 }}
    //   style={{ flex: 1 }}
    // >
    <View style={{ flex: 1, }}>
      <BackgroundGradient />
      <View
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <LocationHeader />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {servicesLoading ? (
            <View style={styles.skeletonPickupContainer}>
              <CustomSkeleton
                width={Dimensions.get('window').width * 0.6}
                height={32}
                borderRadius={8}
              />
              <View style={styles.skeletonPickupGrid}>
                {Array.from({ length: 4 }).map((_, index) => {
                  const cardWidth = (Dimensions.get('window').width - 24 - 32) * 0.48; // 12px margin each side, 16px padding each side, 48% width
                  return (
                    <View key={index} style={styles.skeletonPickupCard}>
                      <CustomSkeleton
                        width={cardWidth}
                        height={80}
                        borderRadius={8}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <LaundryPickupComponent services={services?.data?.services || []} />
          )}

          {/* Dynamic Banners from API */}
          {services?.data?.banners && services.data.banners.length > 0 && (
            <View style={styles.bannerContainer}>
              <FlatList
                ref={bannerFlatListRef}
                data={services.data.banners}
                renderItem={renderBannerItem}
                keyExtractor={(item, index) => item._id || index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleBannerScroll}
                scrollEventThrottle={16}
                style={styles.bannerFlatList}
              />
              {renderPaginationDots()}
            </View>
          )}

          {/* Explore Near You Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore Near You</Text>
              <TouchableOpacity onPress={() => {
                navigation.navigate('ServiceList' as never);
              }}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardsContainer}>
            {vendorsLoading ? (
              // Show skeletons for 5 cards matching the actual card structure
              Array.from({ length: 5 }).map((_, index) => (
                <View key={index} style={styles.skeletonVendorCard}>
                  <View style={styles.skeletonVendorContent}>
                    <View style={styles.skeletonVendorHeader}>
                      <View style={styles.skeletonVendorTextContainer}>
                        <CustomSkeleton width={180} height={24} borderRadius={6} />
                        <View style={styles.skeletonVendorSubtitleRow}>
                          <CustomSkeleton width={80} height={16} borderRadius={4} />
                          <CustomSkeleton width={60} height={16} borderRadius={4} />
                        </View>
                      </View>
                      <CustomSkeleton width={50} height={20} borderRadius={4} />
                    </View>
                    <View style={styles.skeletonVendorServicesRow}>
                      <CustomSkeleton width={70} height={28} borderRadius={8} />
                      <CustomSkeleton width={70} height={28} borderRadius={8} />
                      <CustomSkeleton width={70} height={28} borderRadius={8} />
                    </View>
                    <View style={styles.skeletonVendorFooter}>
                      <View>
                        <CustomSkeleton width={60} height={14} borderRadius={4} />
                        <CustomSkeleton width={80} height={18} borderRadius={4} />
                      </View>
                      <CustomSkeleton width={60} height={48} borderRadius={16} />
                    </View>
                  </View>
                </View>
              ))
            ) : (
              vendors?.data?.vendors?.slice(0, 5).map((vendor, index) => (
                <LaundryServiceCard
                  key={vendor._id || `vendor-${index}`}
                  vendor={vendor}
                  fromPage="home"
                  onPress={() => navigation.navigate('VendorDetail', { vendorId: vendor._id })}
                />
              ))
            )}
          </View>

          <Text
            style={{
              fontSize: 40,
              marginHorizontal: 16,
              marginVertical: 40,
              fontFamily: "Inter-SemiBold",
              fontWeight: "600",
              color: COLORS.TEXT_MUTED,
              fontStyle: "italic",
            }}
          >
            Life Made Easier{"\n"}With otter.
          </Text>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </View>
    // </LinearGradient>
  );
};


