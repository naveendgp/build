import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/theme_extensions.dart';
import '../../../../core/theme/build_context_extensions.dart';
import '../providers/review_providers.dart';
import '../widgets/rating_distribution_card.dart';
import '../widgets/review_card.dart';
import '../widgets/review_creation_modal.dart';

class BrandReviewsTab extends ConsumerWidget {
  final String brandId;
  final bool isOwner;

  const BrandReviewsTab({
    super.key,
    required this.brandId,
    this.isOwner = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviewsAsync = ref.watch(reviewListProvider(brandId));
    final statsAsync = ref.watch(reviewStatsProvider(brandId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Stats Header
        statsAsync.when(
          data: (stats) {
            if (stats.totalReviews == 0) return const SizedBox.shrink();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RatingDistributionCard(stats: stats),
                const SizedBox(height: 24),
              ],
            );
          },
          loading: () => const SizedBox(
            height: 150,
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, __) => const SizedBox.shrink(),
        ),

        // Write Review CTA (Not for owners)
        if (!isOwner) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ElevatedButton(
                onPressed: () => _showWriteReviewModal(context, ref),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: const Text(
                  'Write a Review',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ],

        // Review List
        reviewsAsync.when(
          data: (reviews) {
            if (reviews.isEmpty) {
              return Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.rate_review_outlined, size: 64, color: context.colors.textSecondary.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      Text(
                        'No reviews yet.',
                        style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Be the first to share your experience.',
                        style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                      ),
                    ],
                  ),
                ),
              );
            }

            return Column(
              children: reviews.map((review) {
                return ReviewCard(
                  review: review,
                  onReport: () => _handleReportReview(context, ref, review.id),
                );
              }).toList(),
            );
          },
          loading: () => const Padding(
            padding: EdgeInsets.only(top: 40),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (error, _) => Center(
            child: Text('Failed to load reviews\n$error', textAlign: TextAlign.center, style: const TextStyle(color: Colors.redAccent)),
          ),
        ),
        
        const SizedBox(height: 100),
      ],
    );
  }

  void _showWriteReviewModal(BuildContext context, WidgetRef ref) async {
    final result = await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ReviewCreationModal(brandId: brandId),
    );

    if (result == true) {
      ref.invalidate(reviewListProvider(brandId));
      ref.invalidate(reviewStatsProvider(brandId));
    }
  }

  void _handleReportReview(BuildContext context, WidgetRef ref, String reviewId) async {
    try {
      final repo = ref.read(reviewRepositoryProvider);
      await repo.reportReview(reviewId, "Inappropriate Content"); // In a full app, this would open a selection modal
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review reported successfully'), backgroundColor: Color(0xFF22C55E)),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to report: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }
}
