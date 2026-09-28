import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/dashboard_models.dart';
import '../providers/dashboard_providers.dart';

class DashboardDemographics extends ConsumerWidget {
  const DashboardDemographics({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final demographicsAsync = ref.watch(followerDemographicsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Follower Demographics',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        demographicsAsync.when(
          data: (demographics) => Column(
            children: [
              _buildAgeSection(context, demographics.age),
              const SizedBox(height: AppSpacing.lg),
              _buildLocationSection(context, demographics.location),
              const SizedBox(height: AppSpacing.lg),
              _buildGenderSection(context, demographics.gender),
            ],
          ),
          loading: () => Container(
            height: 300,
            decoration: BoxDecoration(
              color: context.colors.surfaceSecondary,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(child: CircularProgressIndicator.adaptive()),
          ),
          error: (err, _) => Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.colors.error.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'Failed to load demographics',
              style: AppTypography.bodySmall.copyWith(color: context.colors.error),
            ),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 300.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildAgeSection(BuildContext context, List<DemographicItem> ageData) {
    final total = ageData.fold<int>(0, (sum, item) => sum + item.count);
    if (total == 0) {
      return _buildEmptyCard(
        context,
        'Age Distribution',
        Icons.cake_rounded,
        'Age data not yet available',
      );
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.cake_rounded, size: 18, color: context.colors.primaryAccent),
              const SizedBox(width: 8),
              Text(
                'Age Distribution',
                style: AppTypography.titleMedium.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          ...ageData.map((item) {
            final percentage = total > 0 ? (item.count / total * 100) : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  SizedBox(
                    width: 48,
                    child: Text(
                      item.label,
                      style: AppTypography.labelMedium.copyWith(
                        color: context.colors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: percentage / 100,
                        minHeight: 8,
                        backgroundColor: context.colors.surface,
                        valueColor: AlwaysStoppedAnimation(context.colors.primaryAccent),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 40,
                    child: Text(
                      '${percentage.toStringAsFixed(0)}%',
                      style: AppTypography.labelMedium.copyWith(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.end,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildLocationSection(BuildContext context, List<DemographicItem> locationData) {
    final total = locationData.fold<int>(0, (sum, item) => sum + item.count);
    if (total == 0) {
      return _buildEmptyCard(
        context,
        'Top Locations',
        Icons.location_on_rounded,
        'Location data not yet available',
      );
    }

    final top5 = locationData.take(5).toList();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.location_on_rounded, size: 18, color: context.colors.secondaryAccent),
              const SizedBox(width: 8),
              Text(
                'Top Locations',
                style: AppTypography.titleMedium.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          ...top5.asMap().entries.map((entry) {
            final item = entry.value;
            final percentage = total > 0 ? (item.count / total * 100) : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: context.colors.surface,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Center(
                      child: Text(
                        '${entry.key + 1}',
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.textTertiary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item.label,
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${percentage.toStringAsFixed(1)}%',
                    style: AppTypography.labelMedium.copyWith(
                      color: context.colors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildGenderSection(BuildContext context, List<DemographicItem> genderData) {
    final total = genderData.fold<int>(0, (sum, item) => sum + item.count);
    if (total == 0) {
      return _buildEmptyCard(
        context,
        'Gender',
        Icons.people_rounded,
        'Gender data not yet available',
      );
    }

    final colors = [
      context.colors.primaryAccent,
      context.colors.secondaryAccent,
      const Color(0xFF10B981),
      const Color(0xFFF59E0B),
    ];

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.people_rounded, size: 18, color: const Color(0xFF10B981)),
              const SizedBox(width: 8),
              Text(
                'Gender',
                style: AppTypography.titleMedium.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          // Stacked horizontal bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: SizedBox(
              height: 12,
              child: Row(
                children: genderData.asMap().entries.map((entry) {
                  final percentage = total > 0 ? entry.value.count / total : 0.0;
                  return Expanded(
                    flex: (percentage * 1000).round().clamp(1, 1000),
                    child: Container(color: colors[entry.key % colors.length]),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: genderData.asMap().entries.map((entry) {
              final item = entry.value;
              final percentage = total > 0 ? (item.count / total * 100) : 0.0;
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: colors[entry.key % colors.length],
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${item.label} ${percentage.toStringAsFixed(0)}%',
                    style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCard(BuildContext context, String title, IconData icon, String message) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: context.colors.textTertiary),
              const SizedBox(width: 8),
              Text(
                title,
                style: AppTypography.titleMedium.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            message,
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textTertiary),
          ),
          const SizedBox(height: AppSpacing.md),
        ],
      ),
    );
  }
}
