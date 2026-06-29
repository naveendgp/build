import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/theme_extensions.dart';
import '../../../../core/theme/build_context_extensions.dart';
import '../../../brand_profile/models/brand_profile_models.dart';

class ReviewCard extends StatelessWidget {
  final BrandReview review;

  const ReviewCard({
    super.key,
    required this.review,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Avatar, Name, Verified Badge, Date, Report Menu
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: context.colors.surfaceSecondary,
                backgroundImage: (review.authorAvatarUrl != null && review.authorAvatarUrl!.isNotEmpty) ? NetworkImage(review.authorAvatarUrl!) : null,
                child: (review.authorAvatarUrl == null || review.authorAvatarUrl!.isEmpty) ? Icon(Icons.person, size: 20, color: context.colors.textSecondary) : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          review.authorName,
                          style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                        ),
                        if (review.verifiedInteraction) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF22C55E).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.check_circle, size: 10, color: Color(0xFF22C55E)),
                                const SizedBox(width: 4),
                                Text(
                                  'Verified Interaction',
                                  style: AppTypography.labelSmall.copyWith(
                                    color: const Color(0xFF22C55E),
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ]
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      timeago.format(review.createdAt),
                      style: AppTypography.bodySmall.copyWith(
                        color: context.colors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Star Rating
          Row(
            children: List.generate(5, (index) {
              return Icon(
                index < review.rating.round() ? Icons.star : Icons.star_border,
                color: const Color(0xFFFFB800),
                size: 16,
              );
            }),
          ),
          
          const SizedBox(height: 12),
          
          // Title
          if (review.title != null && review.title!.isNotEmpty) ...[
            Text(
              review.title!,
              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
          ],
          
          // Description
          Text(
            review.description,
            style: AppTypography.bodyMedium.copyWith(
              color: context.colors.textSecondary.withValues(alpha: 0.9),
              height: 1.5,
            ),
          ),
          
          // Brand Response
          if (review.brandResponse != null && review.brandResponse!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.reply_rounded, size: 16, color: Color(0xFF7C5CFF)),
                      const SizedBox(width: 8),
                      Text(
                        'Response from Brand',
                        style: AppTypography.bodySmall.copyWith(
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF7C5CFF),
                        ),
                      ),
                      const Spacer(),
                      if (review.brandResponseDate != null)
                        Text(
                          timeago.format(review.brandResponseDate!),
                          style: AppTypography.labelSmall.copyWith(
                            color: context.colors.textSecondary.withValues(alpha: 0.5),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    review.brandResponse!,
                    style: AppTypography.bodyMedium.copyWith(
                      color: context.colors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ]
        ],
      ),
    );
  }
}
