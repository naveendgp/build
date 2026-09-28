import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/dashboard_models.dart';
import '../providers/dashboard_providers.dart';

class DashboardTopContent extends ConsumerWidget {
  const DashboardTopContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMonth = ref.watch(topContentMonthProvider);
    final topContentAsync = ref.watch(topContentProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Top Content',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        _buildMonthSelector(context, ref, selectedMonth),
        const SizedBox(height: AppSpacing.lg),
        topContentAsync.when(
          data: (posts) {
            if (posts.isEmpty) {
              return Container(
                height: 160,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: context.colors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.trending_up_rounded, size: 32, color: context.colors.textTertiary),
                      const SizedBox(height: 8),
                      Text(
                        'No content for ${DateFormat('MMMM yyyy').format(selectedMonth)}',
                        style: AppTypography.bodyMedium.copyWith(
                          color: context.colors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }
            return ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: posts.length,
              separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) => _buildTopPostCard(
                context,
                posts[index],
                index + 1,
              ).animate().fadeIn(delay: (50 * index).ms).slideX(begin: 0.05, end: 0),
            );
          },
          loading: () => Container(
            height: 200,
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
              'Failed to load top content',
              style: AppTypography.bodySmall.copyWith(color: context.colors.error),
            ),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 400.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildMonthSelector(BuildContext context, WidgetRef ref, DateTime selectedMonth) {
    final now = DateTime.now();
    final months = List.generate(6, (i) => DateTime(now.year, now.month - i, 1));

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: months.map((month) {
          final isSelected = month.year == selectedMonth.year && month.month == selectedMonth.month;
          return Padding(
            padding: const EdgeInsets.only(right: AppSpacing.sm),
            child: GestureDetector(
              onTap: () {
                Haptics.selection();
                ref.read(topContentMonthProvider.notifier).state = month;
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? context.colors.textPrimary : context.colors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                  border: Border.all(
                    color: isSelected
                        ? context.colors.textPrimary
                        : context.colors.borderLight.withOpacity(0.1),
                    width: 0.5,
                  ),
                ),
                child: Text(
                  DateFormat('MMM yyyy').format(month),
                  style: AppTypography.labelMedium.copyWith(
                    color: isSelected ? context.colors.background : context.colors.textSecondary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTopPostCard(BuildContext context, TopContentPost post, int rank) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          // Rank badge
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: rank <= 3
                  ? context.colors.primaryAccent.withOpacity(0.15)
                  : context.colors.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '#$rank',
                style: AppTypography.labelSmall.copyWith(
                  color: rank <= 3 ? context.colors.primaryAccent : context.colors.textTertiary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Thumbnail
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: post.thumbnail != null
                ? Image.network(
                    post.thumbnail!,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _buildPlaceholder(context),
                  )
                : _buildPlaceholder(context),
          ),
          const SizedBox(width: 12),
          // Title + date
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.bodyMedium.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    _buildMiniMetric(context, Icons.visibility_rounded, _formatNumber(post.reach)),
                    const SizedBox(width: 10),
                    _buildMiniMetric(context, Icons.favorite_rounded, _formatNumber(post.likes)),
                    const SizedBox(width: 10),
                    _buildMiniMetric(context, Icons.person_add_rounded, _formatNumber(post.leads)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniMetric(BuildContext context, IconData icon, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: context.colors.textTertiary),
        const SizedBox(width: 3),
        Text(
          value,
          style: AppTypography.labelSmall.copyWith(
            color: context.colors.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      color: context.colors.surface,
      child: Icon(Icons.image_rounded, size: 18, color: context.colors.textTertiary),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) return '${(number / 1000000).toStringAsFixed(1)}M';
    if (number >= 1000) return '${(number / 1000).toStringAsFixed(1)}K';
    return number.toString();
  }
}
