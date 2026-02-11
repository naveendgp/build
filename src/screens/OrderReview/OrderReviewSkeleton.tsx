import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomSkeleton from '../../components/CustomSkeleton';
import { COLORS } from '../../constants';

const OrderReviewSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Service Card Skeleton */}
      <View style={styles.serviceCard}>
        {/* Service Header */}
        <View style={styles.serviceHeader}>
          <CustomSkeleton width={150} height={28} borderRadius={8} />
          <CustomSkeleton width={80} height={20} borderRadius={8} />
        </View>

        {/* Express Toggle Skeleton */}
        <View style={styles.expressSkeleton}>
          <CustomSkeleton width={200} height={40} borderRadius={10} />
        </View>

        {/* Items List Skeleton */}
        <View style={styles.itemsContainer}>
          {/* Category Skeleton */}
          <CustomSkeleton width={100} height={20} borderRadius={8} />
          
          {/* Item Cards Skeleton */}
          {[1, 2, 3].map((index) => (
            <View key={index} style={styles.itemCardSkeleton}>
              <View style={styles.itemCardContent}>
                <CustomSkeleton width={120} height={18} borderRadius={8} />
                <CustomSkeleton width={80} height={16} borderRadius={8} />
              </View>
              <View style={styles.quantitySkeleton}>
                <CustomSkeleton width={30} height={30} borderRadius={15} />
                <CustomSkeleton width={40} height={20} borderRadius={8} />
                <CustomSkeleton width={30} height={30} borderRadius={15} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Add Note Skeleton */}
      <View style={styles.addNoteSkeleton}>
        <CustomSkeleton width={180} height={16} borderRadius={8} />
      </View>

      {/* Offers Card Skeleton */}
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <CustomSkeleton width={60} height={16} borderRadius={8} />
        </View>
        <View style={styles.offerContent}>
          <CustomSkeleton width={250} height={18} borderRadius={8} />
        </View>
      </View>

      {/* Delivery Details Card Skeleton */}
      <View style={styles.deliveryCard}>
        <CustomSkeleton width={150} height={24} borderRadius={8} />
        
        {/* Detail Items Skeleton */}
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.detailItemSkeleton}>
            <View style={styles.detailIconSkeleton}>
              <CustomSkeleton width={24} height={24} borderRadius={12} />
            </View>
            <View style={styles.detailTextContainer}>
              <CustomSkeleton width={180} height={18} borderRadius={8} />
              <CustomSkeleton width={140} height={14} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>

      {/* Place Order Button Skeleton */}
      <View style={styles.buttonSkeleton}>
        <CustomSkeleton width={300} height={56} borderRadius={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BACKGROUND,
    marginBottom: 24,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expressSkeleton: {
    marginBottom: 24,
  },
  itemsContainer: {
    gap: 16,
  },
  itemCardSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCardContent: {
    flex: 1,
    gap: 8,
  },
  quantitySkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deliveryCard: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BACKGROUND,
    marginBottom: 24,
    gap: 16,
  },
  detailItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailIconSkeleton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextContainer: {
    flex: 1,
    gap: 6,
  },
  buttonSkeleton: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  addNoteSkeleton: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BACKGROUND,
    marginBottom: 16,
  },
  offerCard: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BACKGROUND,
    marginBottom: 24,
    overflow: 'hidden',
  },
  offerHeader: {
    backgroundColor: '#ECF0FE',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  offerContent: {
    padding: 16,
  },
});

export default OrderReviewSkeleton;

