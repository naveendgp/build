import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../models/dashboard_post.dart';
import '../providers/dashboard_providers.dart';
import '../widgets/dashboard_sections.dart';

/// The brand dashboard, laid out as the web one is: the six summary cards,
/// Interactions over the last 30 days, Campaign mix, then the posts with their
/// views, likes, comments and the result their objective asked for.
///
/// Every number comes from the API — the demographics and performance-score
/// panels that used to sit here were not on the web page and are gone.
class BrandDashboardScreen extends ConsumerWidget {
  const BrandDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(dashboardSummaryProvider);
    final chartsAsync = ref.watch(dashboardChartsProvider);
    final postsAsync = ref.watch(brandDashboardPostsProvider);
    final posts = postsAsync.value ?? const <BrandDashboardPost>[];

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: context.colors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dashboard',
              style: AppTypography.titleLarge.copyWith(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              'How your brand is doing',
              style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: FilledButton.icon(
              onPressed: () => context.push('/create'),
              style: FilledButton.styleFrom(
                backgroundColor: context.colors.primaryAccent,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                minimumSize: const Size(0, 36),
              ),
              icon: const Icon(Icons.add_rounded, size: 16, color: Colors.white),
              label: Text(
                'Create',
                style: AppTypography.labelLarge.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardSummaryProvider);
          ref.invalidate(dashboardChartsProvider);
          ref.invalidate(brandDashboardPostsProvider);
        },
        color: context.colors.primaryAccent,
        backgroundColor: context.colors.surface,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.md,
            AppSpacing.md,
            AppSpacing.xxl,
          ),
          children: [
            // 1. Summary
            summaryAsync.when(
              data: (summary) =>
                  DashboardSummaryCards(summary: summary, postCountFallback: posts.length),
              loading: () => const _Skeleton(height: 220),
              error: (err, _) => _Failed(message: 'Could not load your numbers', error: err),
            ),
            const SizedBox(height: AppSpacing.md),

            // 2. Interactions, last 30 days
            chartsAsync.when(
              data: (charts) => DashboardInteractionsChart(trend: charts.reachTrend),
              loading: () => const _Skeleton(height: 260),
              error: (err, _) => _Failed(message: 'Could not load interactions', error: err),
            ),
            const SizedBox(height: AppSpacing.md),

            // 3. Campaign mix
            postsAsync.when(
              data: (list) => DashboardCampaignMix(posts: list),
              loading: () => const _Skeleton(height: 160),
              error: (_, _) => const SizedBox.shrink(),
            ),
            const SizedBox(height: AppSpacing.md),

            // 4. Posts
            postsAsync.when(
              data: (list) => DashboardPostsSection(posts: list),
              loading: () => const _Skeleton(height: 280),
              error: (err, _) => _Failed(message: 'Could not load your posts', error: err),
            ),
          ],
        ),
      ),
    );
  }
}

class _Skeleton extends StatelessWidget {
  final double height;
  const _Skeleton({required this.height});

  @override
  Widget build(BuildContext context) => Container(
    height: height,
    decoration: BoxDecoration(
      color: context.colors.surfaceSecondary,
      borderRadius: AppSpacing.borderRadiusMd,
    ),
    child: Center(
      child: CircularProgressIndicator.adaptive(
        valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
      ),
    ),
  );
}

class _Failed extends StatelessWidget {
  final String message;
  final Object error;
  const _Failed({required this.message, required this.error});

  @override
  Widget build(BuildContext context) {
    debugPrint('[dashboard] $message: $error');
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        border: Border.all(color: context.colors.borderLight, width: 0.5),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline_rounded, size: 18, color: context.colors.textSecondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              '$message. Pull down to try again.',
              style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
