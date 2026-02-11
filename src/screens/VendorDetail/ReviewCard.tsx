import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import StarIcon from "../../assets/auto-generated-svg-icons/CardStar";
import { COLORS } from "../../constants";
import styles from "./style";

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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>
          <View>
            <Text style={styles.reviewerName}>{reviewerName}</Text>
            <Text style={styles.reviewDate}>{reviewDate}</Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          <StarIcon fill={COLORS.SUCCESS} />
          <Text style={styles.reviewRatingText}>{rating}</Text>
        </View>
      </View>
      <Text style={styles.reviewService}>{reviewService}</Text>

      <Text style={styles.reviewText}>{reviewText}</Text>
    </View>
  );
};

export default ReviewCard;
