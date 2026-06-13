import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../models/user_profile_models.dart';

class InterestsTab extends StatelessWidget {
  const InterestsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [context.colors.primaryAccent.withValues(alpha: 0.2), context.colors.surface],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: AppSpacing.borderRadiusLg,
              border: Border.all(color: context.colors.primaryAccent.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.auto_awesome_rounded, color: context.colors.primaryAccent, size: 28),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('AI Taste Profile', style: AppTypography.titleMedium.copyWith(color: context.colors.primaryAccent)),
                      const SizedBox(height: 4),
                      Text('Based on your activity, you love modern cafes and luxury fashion.',
                          style: AppTypography.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Your Interests', style: AppTypography.titleLarge),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: InterestItem.mockList.map((interest) {
              return Container(
                decoration: BoxDecoration(
                  borderRadius: AppSpacing.borderRadiusFull,
                  image: DecorationImage(
                    image: NetworkImage(interest.imageUrl),
                    fit: BoxFit.cover,
                    colorFilter: ColorFilter.mode(Colors.black.withValues(alpha: 0.4), BlendMode.darken),
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
                child: Text(
                  interest.label,
                  style: AppTypography.labelLarge.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
