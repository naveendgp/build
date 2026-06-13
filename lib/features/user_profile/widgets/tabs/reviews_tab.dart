import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';

class ReviewsTab extends StatelessWidget {
  const ReviewsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.rate_review_rounded, size: 64, color: context.colors.textTertiary),
            const SizedBox(height: AppSpacing.md),
            Text('No Reviews Yet', style: AppTypography.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Your reviews of brands and products will appear here.',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
