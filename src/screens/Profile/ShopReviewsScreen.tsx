import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    ScrollView,
    Text,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toolbar from '../../components/Toolbar';
import CustomText from '../../components/Text';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { RootStackParamList } from '../../navigation/AppNavigator';
import StarIcon from '../../assets/auto-generated-svg-icons/StarIcon';
import { COLORS, FONTFAMILY } from '../../constants/colors';
import styles from './styles';
import EmptyIcon from '../../assets/auto-generated-svg-icons/EmptyIcon';
import EmptyScreen from '../../components/EmptyScreen';

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
                    <View style={styles.avatar2}>
                        <Text style={styles.avatarText2}>{avatarText}</Text>
                    </View>
                    <View>
                        <Text style={styles.reviewerName}>{reviewerName}</Text>
                        <Text style={styles.reviewDate}>{reviewDate}</Text>
                    </View>
                </View>
                <View style={styles.reviewRating}>
                    <StarIcon width={24} height={24} fill={COLORS.SUCCESS} />
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
    const { profile, isLoading } = useProfileStore();
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);

    // Use mock data if profile data is not available
    const reviewsData = profile?.rating?.reviews && profile.rating.reviews.length > 0
        ? profile.rating.reviews
        : [];

    // Transform reviews data
    const transformedReviews = useMemo(() => {
        if (!reviewsData || !Array.isArray(reviewsData)) {
            return [];
        }

        return reviewsData.map((review: any, index: number) => {
            // Extract reviewer name (could be from review.user_name, review.customer_name, etc.)
            const reviewerName = review.user_name || review.customer_name || review.name || `Customer ${index + 1}`;

            // Get first letter for avatar
            const avatarText = reviewerName.charAt(0).toUpperCase();

            // Format date
            const reviewDate = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })
                : review.date || 'N/A';

            // Get service name
            const reviewService = review.service_name || review.service || 'Service';

            // Get rating
            const rating = review.rating || review.star_rating || 0;

            // Get review text
            const reviewText = review.comment || review.review || review.feedback || 'No comment provided.';

            return {
                id: review._id || review.id || `review-${index}`,
                reviewerName,
                reviewDate,
                reviewService,
                rating,
                reviewText,
                avatarText,
            };
        });
    }, [reviewsData]);

    // Display data for rating summary - use mock data if profile data is not available
    const displayData = useMemo(() => {
        if (profile?.rating?.average && profile.rating.total_reviews) {
            return {
                rating: profile.rating.average,
                totalReviews: profile.rating.total_reviews,
            };
        }

    }, [profile?.rating]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Toolbar title="Shop Review" />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={transformedReviews.length === 0
                    ? { flexGrow: 1, paddingBottom: 32 }
                    : { paddingBottom: 32 }
                }
            >
                <View style={[
                    styles.reviewSection,
                    transformedReviews.length === 0 && styles.reviewSectionEmpty
                ]}>


                    {isLoadingReviews ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={COLORS.THEME_GREEN} />
                            <Text style={{ marginTop: 8, color: COLORS.LOGIN_SUBTITLE }}>
                                Loading reviews...
                            </Text>
                        </View>
                    ) : transformedReviews.length === 0 ? (
                        <EmptyScreen
                            title="No reviews found"
                            subtitle="No reviews found for this shop."
                        />
                    ) : (
                        <>
                            <Text style={styles.sectionTitle2}>Reviews</Text>

                            <View style={styles.ratingSummary}>
                                <View style={styles.ratingContainer}>
                                    <Text style={styles.largeRatingText}>
                                        {displayData?.rating?.toFixed(1) || '0.0'}
                                    </Text>
                                    <StarIcon width={24} height={24} fill={COLORS.SUCCESS} />
                                    <StarIcon width={24} height={24} fill={COLORS.SUCCESS} />
                                    <StarIcon width={24} height={24} fill={COLORS.SUCCESS} />
                                    <StarIcon width={24} height={24} fill={COLORS.SUCCESS} />
                                    <StarIcon width={24} height={24} fill={COLORS.SUCCESS} />
                                    <Text style={styles.ratingCount}>
                                        By {displayData?.totalReviews || 0}+
                                    </Text>
                                </View>
                            </View>
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
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ShopReviewsScreen;

