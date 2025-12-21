import React, { useMemo, useCallback, useEffect } from 'react';
import {
    View,
    FlatList,
    Text,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import Toolbar from '../../../components/Toolbar';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import StarIcon from '../../../assets/auto-generated-svg-icons/StarIcon';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';
import EmptyScreen from '../../../components/EmptyScreen';
import { Review } from '../../../apiService/types/profileTypes';
import { useVendorReviewsPagination } from './hooks/useVendorReviewsPagination';
import { showErrorToast } from '../../../utils/Toast';
import HalfStarIcon from '../../../assets/auto-generated-svg-icons/HalfStar';
import RatingStarIcon from '../../../assets/auto-generated-svg-icons/RatingStar';
import RatingUserIcon from '../../../assets/auto-generated-svg-icons/RatingUser';

type ShopReviewsNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'ShopReviewsScreen'
>;

interface ReviewCardProps {
    reviewerName: string;
    reviewDate: string;
    reviewService: string;
    rating: number;
    reviewText: string;
    avatarText: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
    reviewerName,
    reviewDate,
    reviewService,
    rating,
    reviewText,
    avatarText,
}) => {
    return (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                    <RatingUserIcon />
                    <View>
                        <Text style={styles.reviewerName}>{reviewerName}</Text>
                        <Text style={styles.reviewDate}>{reviewDate}</Text>
                    </View>
                </View>
                <View style={styles.reviewRating}>
                    <RatingStarIcon width={24} height={24} fill={COLORS.SUCCESS} />
                    <Text style={styles.reviewRatingText}>{rating}</Text>
                </View>
            </View>
            <Text style={styles.reviewService}>{reviewService}</Text>
            <Text style={styles.reviewText}>{reviewText}</Text>
        </View>
    );
};



const ShopReviewsScreen: React.FC = () => {
    const navigation = useNavigation<ShopReviewsNavProp>();
    const insets = useSafeAreaInsets();
    const { profile } = useProfileStore();

    // Fetch reviews using useQuery with pagination
    const {
        data: reviews,
        isLoading: isLoadingReviews,
        isError,
        error,
        hasNextPage,
        loadMore,
        isFetchingMore: isLoadingMoreReviews,
        total,
        refetch,
        isRefetching,
    } = useVendorReviewsPagination(true, 10);

    // Handle error - show toast notification
    useEffect(() => {
        if (isError && error) {
            const errorMessage = (error as AxiosError<{ message: string }>).response?.data?.message || (error as Error).message || 'Failed to load reviews';
            showErrorToast(errorMessage);
        }
    }, [isError, error]);

    // Load more when reaching end
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isLoadingMoreReviews && !isLoadingReviews) {
            loadMore();
        }
    }, [hasNextPage, isLoadingMoreReviews, isLoadingReviews, loadMore]);

    // Type for transformed review item
    type TransformedReview = {
        id: string;
        reviewerName: string;
        reviewDate: string;
        reviewService: string;
        rating: number;
        reviewText: string;
        avatarText: string;
    };

    // Transform reviews data
    const transformedReviews = useMemo<TransformedReview[]>(() => {
        if (!reviews || !Array.isArray(reviews)) {
            return [];
        }

        return reviews.map((review: Review) => {
            // Extract reviewer name
            const reviewerName = review.user_id?.name || 'Customer';

            // Get first letter for avatar
            const avatarText = reviewerName.charAt(0).toUpperCase();

            // Format date
            const reviewDate = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })
                : 'N/A';

            // Get service name
            const reviewService = review.serviceName || 'Service';

            // Get rating
            const rating = review.rating || 0;

            // Get review text
            const reviewText = review.comment || 'No comment provided.';

            return {
                id: review._id,
                reviewerName,
                reviewDate,
                reviewService,
                rating,
                reviewText,
                avatarText,
            };
        });
    }, [reviews]);

    // Display data for rating summary
    const displayData = useMemo(() => {
        if (profile?.rating?.average && profile.rating.total_reviews) {
            return {
                rating: profile.rating.average,
                totalReviews: profile.rating.total_reviews,
            };
        }
        // Fallback to total from API if profile data not available
        return {
            rating: profile?.rating?.average || 0,
            totalReviews: total || 0,
        };
    }, [profile?.rating, total]);

    // Render review item
    const renderReviewItem = useCallback(({ item, index }: { item: TransformedReview; index: number }) => {
        return (
            <View style={index > 0 ? { marginTop: 12 } : undefined}>
                <ReviewCard
                    reviewerName={item.reviewerName}
                    reviewDate={item.reviewDate}
                    reviewService={item.reviewService}
                    rating={item.rating}
                    reviewText={item.reviewText}
                    avatarText={item.avatarText}
                />
            </View>
        );
    }, []);

    // Key extractor
    const keyExtractor = useCallback((item: TransformedReview) => item.id, []);

    // List header component (rating summary)
    const renderHeader = useCallback(() => {
        if (isLoadingReviews) {
            return (
                <View style={[styles.reviewSection, { padding: 20, alignItems: 'center' }]}>
                    <ActivityIndicator size="small" color={COLORS.THEME_GREEN} />
                    <Text style={{ marginTop: 8, color: COLORS.LOGIN_SUBTITLE }}>
                        Loading reviews...
                    </Text>
                </View>
            );
        }

        if (transformedReviews.length === 0) {
            return null;
        }

        const renderStars = () => {
            const rating = displayData?.rating || 0;
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 !== 0;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

            const stars = [];

            // Render full stars
            for (let i = 0; i < fullStars; i++) {
                stars.push(
                    <RatingStarIcon key={`full-${i}`} width={24} height={24} fill={COLORS.SUCCESS} />
                );
            }

            // Render half star if applicable
            if (hasHalfStar) {
                stars.push(
                    <HalfStarIcon key="half" width={24} height={24} fill={COLORS.SUCCESS} />
                );
            }

            // Render empty stars


            return stars;
        };

        return (
            <View style={styles.reviewSection}>
                <Text style={styles.sectionTitle2}>Reviews</Text>
                <View style={styles.ratingSummary}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.largeRatingText}>
                            {displayData?.rating?.toFixed(1) || '0.0'}
                        </Text>
                        {renderStars()}
                        <Text style={styles.ratingCount}>
                            By {displayData?.totalReviews || 0}{displayData?.totalReviews > 99 ? '+' : ''}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }, [isLoadingReviews, transformedReviews.length, displayData]);

    // List footer component (loading more indicator)
    const renderFooter = useCallback(() => {
        if (!hasNextPage) {
            return <View style={{ height: 32 }} />;
        }

        if (isLoadingMoreReviews) {
            return (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={COLORS.THEME_GREEN} />
                    <Text style={{ marginTop: 8, color: COLORS.LOGIN_SUBTITLE }}>
                        Loading more reviews...
                    </Text>
                </View>
            );
        }

        return <View style={{ height: 32 }} />;
    }, [hasNextPage, isLoadingMoreReviews]);

    // Empty component
    const renderEmpty = useCallback(() => {
        if (isLoadingReviews) {
            return (
                <View style={[styles.reviewSection, styles.reviewSectionEmpty, { padding: 20, alignItems: 'center' }]}>
                    <ActivityIndicator size="small" color={COLORS.THEME_GREEN} />
                    <Text style={{ marginTop: 8, color: COLORS.LOGIN_SUBTITLE }}>
                        Loading reviews...
                    </Text>
                </View>
            );
        }

        return (
            <View style={[styles.reviewSection, styles.reviewSectionEmpty]}>
                <EmptyScreen
                    title="No reviews found"
                    subtitle="No reviews found for this shop."
                />
            </View>
        );
    }, [isLoadingReviews]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <Toolbar title="Shop Review" />

            <FlatList
                data={transformedReviews}
                renderItem={renderReviewItem}
                keyExtractor={keyExtractor}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={
                    transformedReviews.length === 0
                        ? { flexGrow: 1 }
                        : { paddingBottom: insets.bottom + 32 }
                }
                showsVerticalScrollIndicator={false}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.1}
                refreshing={isRefetching}
                onRefresh={refetch}
            />
        </SafeAreaView>
    );
};

export default ShopReviewsScreen;

