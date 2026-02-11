import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Toolbar, { toolbarStyles } from "../../components/Toolbar";
import ExpressIcon from "../../assets/auto-generated-svg-icons/ExpressDetail";
import LocationLine from "../../assets/auto-generated-svg-icons/LocationLine";
import StarIcon from "../../assets/auto-generated-svg-icons/RatingStar";
import HalfStarIcon from "../../assets/auto-generated-svg-icons/HalfStar";
import Discount from "../../assets/auto-generated-svg-icons/Discount";
import { COLORS } from "../../constants";
import styles from "./style";
import ReviewCard from "./ReviewCard";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { useVendorDetail } from "./hooks/useVendorDetail";
import SvgBackArrowIcon from "../../assets/auto-generated-svg-icons/BackArrowIcon";
import SvgLocationIcon from "../../assets/auto-generated-svg-icons/LocationIcon";
import SvgLocationLine from "../../assets/auto-generated-svg-icons/LocationLine";
import BackgroundGradient from "../../components/backgroundGradient";
import CustomBtn from "../../components/CustomBtn";
import SvgLocation20Icon from "../../assets/auto-generated-svg-icons/Location20Icon";
import EmptyScreen from "../../components/EmptyScreen";
import { VendorService } from "../../types/vendor/vendorDetail";
import { useOrderStore } from "../../state/zustand/orderStore";

type VendorDetailNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "VendorDetail"
>;

type VendorDetailRouteProp = RouteProp<RootStackParamList, "VendorDetail">;

const VendorDetail = () => {
  const navigation = useNavigation<VendorDetailNavProp>();
  const route = useRoute<VendorDetailRouteProp>();


  // Get vendorId from route params
  const vendorId = route.params?.vendorId;
  const selectedFilterId = route.params?.selectedFilterId;

  const { clearAll } = useOrderStore()
  const { vendor, displayData, distance, offerDetails, isLoading, error, refetch, reviews, isLoadingReviews, isLoadingMoreReviews, hasMoreReviews, loadMoreReviews, expressDetails } = useVendorDetail(vendorId);
  const [selectedService, setSelectedService] = useState<string>("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [tabCategories, setTabCategories] = useState<string[]>([]);
  const [maxCountPerItem, setMaxCountPerItem] = useState<number>(0);
  const [selectedMatchedService, setSelectedMatchedService] = useState<VendorService | null>(null);



  // Reset service selection when screen comes into focus (entering page or coming back)
  useFocusEffect(
    useCallback(() => {
      // Reset selection to no service selected
      setSelectedService("");
      setSelectedServiceId("");
      setTabCategories([]);
      setMaxCountPerItem(0);
      setSelectedMatchedService(null);
    }, [])
  );

  // 1️⃣ Match service based on selected filter (pure computation)
  const matchedServiceFromFilter = useMemo(() => {
    if (!selectedFilterId || !displayData?.services || !vendor?.services_offered) {
      return null;
    }

    const serviceMatch = displayData.services.find(
      s => s.service_id === selectedFilterId
    );

    if (!serviceMatch) return null;

    const vendorService = vendor.services_offered.find(
      s =>
        s.service_id === serviceMatch.service_id ||
        s.service_name === serviceMatch.service_name
    );

    return {
      serviceMatch,
      vendorService,
    };
  }, [selectedFilterId, displayData?.services, vendor?.services_offered]);


  // 2️⃣ Prepare tab categories from matched service (heavy work isolated)
  const tabCategoriesFromService = useMemo(() => {
    const items = matchedServiceFromFilter?.vendorService?.items;
    if (!items || items.length === 0) return [];

    const categories = items
      .map(it => it.category)
      .filter(Boolean);

    const uniqueCategories = Array.from(new Set(categories));

    const capitalize = (s: string) =>
      s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    return uniqueCategories.map(capitalize);
  }, [matchedServiceFromFilter]);


  // 3️⃣ Apply auto-selection (side-effects only)
  useEffect(() => {
    if (!matchedServiceFromFilter) return;
    if (selectedService) return;

    const { serviceMatch, vendorService } = matchedServiceFromFilter;



    setSelectedService(serviceMatch.service_name);
    setSelectedServiceId(serviceMatch.service_id);
    setSelectedMatchedService(vendorService || null);

    if (serviceMatch.service_name === "Iron" || serviceMatch.service_name === "Dry Clean") {
      setTabCategories(
        tabCategoriesFromService.length
          ? tabCategoriesFromService
          : ["Men", "Women"]
      );
    } else {
      setTabCategories(["Weight"]);
    }

    setMaxCountPerItem(vendorService?.max_count_per_day ?? 0);
  }, [matchedServiceFromFilter, tabCategoriesFromService, selectedService]);


  // Auto-select service if filter ID is passed
  // useEffect(() => {
  //   // Only auto-select if we have data, a filter ID, and haven't selected anything yet
  //   if (selectedFilterId && displayData?.services && vendor?.services_offered && !selectedService) {
  //     const match = displayData.services.find(s => s.service_id === selectedFilterId);

  //     if (match) {
  //       console.log("Auto-selecting service based on filter:", match.service_name);
  //       setSelectedService(match.service_name);
  //       setSelectedServiceId(match.service_id);

  //       const matchedService = vendor.services_offered.find(
  //         s => s.service_id === match.service_id || s.service_name === match.service_name
  //       );

  //       const categoriesFromItems = matchedService?.items?.map(it => it.category) || [];
  //       const uniqueCategories = Array.from(new Set(categoriesFromItems.filter(Boolean)));

  //       const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  //       const normalizedCategories = uniqueCategories.map(c => capitalize(c));

  //       if (match.service_name === 'Iron' || match.service_name === 'Dry Clean') {
  //         setTabCategories(normalizedCategories.length ? normalizedCategories : ['Men', 'Women']);
  //       } else {
  //         setTabCategories(['Weight']);
  //       }

  //       setSelectedMatchedService(matchedService || null);

  //       const maxCount = matchedService?.max_count_per_day ?? 0;
  //       setMaxCountPerItem(maxCount);
  //     }
  //   }
  // }, [displayData, vendor, selectedFilterId, selectedService]);

  // Transform API reviews to match ReviewCard format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (n: number): string => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  // const transformedReviews = reviews.map((review) => {
  //   const reviewerName = review.user_id?.name || 'Anonymous';
  //   const firstLetter = reviewerName.charAt(0).toUpperCase();

  //   return {
  //     id: review._id,
  //     reviewerName: reviewerName,
  //     reviewDate: formatDate(review.createdAt),
  //     reviewService: review.serviceName ? `Services - ${review.serviceName}` : `Order #${review.order_id.slice(-6)}`,
  //     rating: review.rating,
  //     reviewText: review.comment || 'No comment provided',
  //     avatarText: firstLetter,
  //   };
  // });

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>

        <BackgroundGradient />
        <View style={[styles.container]}>

          <Toolbar
            title="Shop Details"
            onBackPress={() => navigation.goBack()}
            style={{ backgroundColor: "transparent" }}
          />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
            <Text style={{ marginTop: 12, color: COLORS.LOGIN_SUBTITLE }}>
              Loading vendor details...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const handleProceed = () => {

    clearAll()  // Sometimes The Express Data , Selected Items Are Not Clearing Some States 


    // Prefer the pricing_type from the matched vendor service if available
    const pricingType = selectedMatchedService?.pricing_type;

    if (pricingType === 'per_pc' || selectedService === 'Iron' || selectedService === 'Dry Clean') {
      navigation.navigate('ServiceItemOrder', {
        serviceName: selectedService,
        vendorDetails: vendor,
        serviceId: selectedServiceId,
        tabCategories: tabCategories.length ? tabCategories : ['Men', 'Women'],
        maxCountPerItem: maxCountPerItem,
      });
      return;
    }

    // Default to weight flow for per_kg or unknown pricing type
    navigation.navigate('ServiceWeightOrder', {
      serviceName: selectedService,
      serviceImage: displayData?.services.find(service => service.service_name === selectedService)?.image_url ?? '',
      vendorDetails: vendor,
      serviceId: selectedServiceId,
      tabCategories: tabCategories.length ? tabCategories : ['Weight'],
      serviceDetails: selectedMatchedService || undefined,
    });
  };

  const getOfferPercent = () => {
    const maxValue = displayData?.services
      .map(item => item.maxOfferPercent || 0)
      .reduce((max, curr) => Math.max(max, curr), 0);

    return maxValue;
  }

  const getOfferText = (percentage: number, cap: number) => {
    if (!percentage || percentage <= 0) return "";
    if (!cap) return `Flat ${percentage}% off`;

    return `Flat ${percentage}% off, up to ₹${cap}`;
  };

  const renderStars = (rating: number) => {
    console.log('renderStars - rating received:', rating);
    console.log('renderStars - rating type:', typeof rating);
    console.log('renderStars - displayData?.rating:', displayData?.rating);
    console.log('renderStars - displayData:', displayData);

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.25; // Show half star if decimal part is >= 0.25
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    console.log('renderStars - fullStars calculated:', fullStars);
    console.log('renderStars - hasHalfStar:', hasHalfStar);
    console.log('renderStars - emptyStars:', emptyStars);

    const stars = [];

    // Render full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIcon key={`full-${i}`} />
      );
    }

    // Render half star if needed
    if (hasHalfStar) {
      stars.push(
        <HalfStarIcon key="half" />
      );
    }



    return stars;
  };
  // Error state
  if (error) {
    return (
      <View style={{ flex: 1 }}>
        <BackgroundGradient />
        <View

          style={[styles.container]}
        >
          <Toolbar
            title="Shop Details"
            onBackPress={() => navigation.goBack()}
            style={{ backgroundColor: "transparent" }}
          />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ color: COLORS.ERROR, textAlign: "center", marginBottom: 12 }}>
              {error}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.THEME_GREEN,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
              onPress={refetch}
            >
              <Text style={{ color: COLORS.WHITE, fontWeight: "600" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <View

        style={[styles.container]}
      >
        <Toolbar
          title="Shop Details"
          onBackPress={() => {
            setSelectedService("");
            setSelectedServiceId("");
            navigation.goBack();
          }}
          style={{ backgroundColor: "transparent" }}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const paddingToBottom = 100; // Trigger 100px before the end
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

            if (isCloseToBottom && hasMoreReviews && !isLoadingMoreReviews && !isLoadingReviews && reviews.length > 0) {
              loadMoreReviews();
            }
          }}
          scrollEventThrottle={400}
        >
          {/* Vendor Details Section */}
          <View style={styles.vendorSection}>
            <Text style={styles.vendorName}>{displayData?.shopName ?? "-"}</Text>

            <View style={styles.ratingContainer}>
              {(vendor?.rating?.average ?? 0) > 0 && <StarIcon />}
              {(vendor?.rating?.average ?? 0) > 0 && (<Text style={styles.ratingText}>{displayData?.rating ?? ''}</Text>)}
              {(vendor?.rating?.total_reviews ?? 0) > 0 && (
                <Text style={styles.ratingCount}>
                  By {vendor?.rating?.total_reviews && vendor.rating.total_reviews > 99 ? '99+' : vendor?.rating?.total_reviews}
                </Text>
              )}


            </View>

            <View style={styles.infoRow}>
              {/* <Image
                source={require("../../assets/icons/LocationLine.png")}
                style={{ width: 20, height: 20 }}
              /> */}
              <SvgLocation20Icon />
              <Text style={styles.infoText}>{distance?.distance_text} - {vendor?.address?.address_line1 ?? "-"}</Text>
            </View>

            {/* <View style={styles.infoRow}>
              <Image
                source={require("../../assets/icons/LocationLine.png")}
                style={{ width: 20, height: 20 }}
              />
              <Text style={styles.infoText}>Standard (Delivery 48 Hours)</Text>
            </View> */}

            {(offerDetails?.is_offer || expressDetails?.is_express_available) && (
              <View style={styles.badgeContainer}>

                {/* Express Badge */}
                {expressDetails?.is_express_available && (
                  <View style={styles.expressBadge}>
                    <ExpressIcon />
                    <Text style={styles.expressText}>Express Available</Text>
                  </View>
                )}

                {/* Offer Badge */}
                {offerDetails?.is_offer && offerDetails?.max_offer_percentage && (
                  <View style={styles.discountBanner}>
                    <Discount />
                    <Text style={styles.discountText}>
                      {getOfferText(
                        offerDetails.max_offer_percentage.total_percentage,
                        offerDetails.max_offer_percentage.max_cap
                      )}
                    </Text>
                  </View>
                )}

              </View>
            )}

          </View>

          {/* Services Section */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services</Text>

            {displayData?.services.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={styles.serviceCard}
                onPress={() => {
                  setSelectedService(service.service_name)
                  setSelectedServiceId(service.service_id)

                  // Find the full VendorService from vendor.services_offered to extract items/categories and max count
                  const matchedService = vendor?.services_offered?.find(s => s.service_id === service.service_id || s.service_name === service.service_name);

                  // Derive categories from the service's items (unique)
                  const categoriesFromItems = matchedService?.items?.map(it => it.category) || [];
                  const uniqueCategories = Array.from(new Set(categoriesFromItems.filter(Boolean)));

                  // Normalize categories to Title Case so downstream hooks/components receive consistent keys
                  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                  const normalizedCategories = uniqueCategories.map(c => capitalize(c));

                  // For Iron / Dry Clean, prefer categories from items if available, otherwise fallback to Men/Women
                  if (service.service_name === 'Iron' || service.service_name === 'Dry Clean') {
                    setTabCategories(normalizedCategories.length ? normalizedCategories : ['Men', 'Women']);
                  } else {
                    setTabCategories(['Weight']);
                  }

                  // store matched full service for later navigation decisions
                  setSelectedMatchedService(matchedService || null);

                  // Extract max count per item from matched service (fallback to 0)
                  const maxCount = matchedService?.max_count_per_day ?? 0;
                  setMaxCountPerItem(maxCount);
                }}
              >
                <View style={styles.serviceContent}>
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedService === service.service_name &&
                        styles.radioSelected,
                      ]}
                    >
                      {selectedService === service.service_name && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.serviceName}>{service.service_name}</Text>
                  </View>
                  <Image source={{ uri: service.image_url }} style={styles.serviceIcon} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Review Section */}
          {/* <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Reviews</Text>

            {displayData?.rating ? (
              <View style={styles.ratingSummary}>
                <View style={styles.ratingContainer}>
                  <Text style={styles.largeRatingText}>{displayData?.rating?.toFixed(1) || '0.0'}</Text>
                  {renderStars(displayData?.rating || 0)}
                  <Text style={styles.ratingCount}>
                    By {displayData?.totalReviews && displayData.totalReviews > 99 ? '99+' : (displayData?.totalReviews || 0)}
                  </Text>
                </View>
              </View>
            ) : null}

            {isLoadingReviews ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.THEME_GREEN} />
                <Text style={{ marginTop: 8, color: COLORS.LOGIN_SUBTITLE }}>
                  Loading reviews...
                </Text>
              </View>
            ) : transformedReviews.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>

                <EmptyScreen
                  title="No reviews yet"
                  subtitle="Be the first to review this shop"
                />
              </View>
            ) : (
              <>
                {transformedReviews.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 && <View style={{ height: 12 }} />}
                    <ReviewCard
                      reviewerName={item.reviewerName}
                      reviewDate={item.reviewDate}
                      reviewService={item.reviewService}
                      rating={item.rating}
                      reviewText={item.reviewText}
                      avatarText={item.avatarText}
                    />
                  </View>
                ))}
                {isLoadingMoreReviews && (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={COLORS.THEME_GREEN} />
                    <Text style={{ marginTop: 8, color: COLORS.LOGIN_SUBTITLE }}>
                      Loading more reviews...
                    </Text>
                  </View>
                )}
              </>
            )}
          </View> */}
        </ScrollView>
      </View>
      {/* Fixed Proceed Button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomButtonContainer}>
        <CustomBtn
          title="Proceed"
          onPress={handleProceed}
          disabled={!selectedService}
          style={styles.proceedButton}
          variant="primary"
        />
      </SafeAreaView>
    </View>
  );
};

export default VendorDetail;
