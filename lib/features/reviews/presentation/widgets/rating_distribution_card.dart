import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/theme_extensions.dart';
import '../../../../core/theme/build_context_extensions.dart';
import '../../../brand_profile/models/brand_profile_models.dart';

class RatingDistributionCard extends StatelessWidget {
  final ReviewStats stats;

  const RatingDistributionCard({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.colors.border),
      ),
      child: Row(
        children: [
          // Average Rating Column
          Expanded(
            flex: 2,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  stats.averageRating.toStringAsFixed(1),
                  style: AppTypography.displayLarge.copyWith(
                    fontSize: 48,
                    fontWeight: FontWeight.w800,
                    height: 1.0,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    return Icon(
                      index < stats.averageRating.round() ? Icons.star : Icons.star_border,
                      color: const Color(0xFFFFB800),
                      size: 16,
                    );
                  }),
                ),
                const SizedBox(height: 8),
                Text(
                  '${stats.totalReviews} Reviews',
                  style: AppTypography.bodySmall.copyWith(
                    color: context.colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          
          // Divider
          Container(
              height: 100,
              width: 1,
              color: context.colors.border,
              margin: const EdgeInsets.symmetric(horizontal: 20),
          ),
          
          // Distribution Bars
          Expanded(
            flex: 3,
            child: Column(
              children: List.generate(5, (index) {
                final starNum = 5 - index;
                final count = stats.distribution[starNum] ?? 0;
                final ratio = stats.totalReviews > 0 ? count / stats.totalReviews : 0.0;
                
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Text(
                        '$starNum',
                        style: AppTypography.bodySmall.copyWith(
                          fontWeight: FontWeight.bold,
                          color: context.colors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.star, color: Color(0xFFFFB800), size: 12),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                              value: ratio,
                              minHeight: 8,
                              backgroundColor: context.colors.border,
                              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFFB800)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 24,
                        child: Text(
                          '$count',
                          textAlign: TextAlign.end,
                          style: AppTypography.bodySmall.copyWith(
                            color: context.colors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
