import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../providers/dashboard_providers.dart';
import '../widgets/dashboard_kpi_cards.dart';
import '../widgets/dashboard_charts.dart';
import '../widgets/dashboard_post_card_list.dart';

class BrandDashboardScreen extends ConsumerWidget {
  const BrandDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(dashboardSummaryProvider);
    final chartsAsync = ref.watch(dashboardChartsProvider);
    final postsAsync = ref.watch(dashboardPostsProvider);

    return Scaffold(
      backgroundColor: context.colors.background,
      endDrawer: _buildAnalyticsDrawer(context, ref),
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: context.colors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Brand Dashboard',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          _buildPeriodSelector(context, ref),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardSummaryProvider);
          ref.invalidate(dashboardChartsProvider);
          ref.invalidate(dashboardPostsProvider);
        },
        color: context.colors.primaryAccent,
        backgroundColor: context.colors.surface,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. KPI Cards
              summaryAsync.when(
                data: (summary) => DashboardKpiCards(summary: summary),
                loading: () => const _LoadingSkeleton(height: 240),
                error: (err, stack) => _ErrorWidget(error: err),
              ),
              const SizedBox(height: AppSpacing.xxl),

              // 2. Charts
              chartsAsync.when(
                data: (charts) => DashboardCharts(data: charts),
                loading: () => const _LoadingSkeleton(height: 400),
                error: (err, stack) => _ErrorWidget(error: err),
              ),
              const SizedBox(height: AppSpacing.xxl),

              // 3. Posts List (Premium Cards)
              postsAsync.when(
                data: (posts) => DashboardPostCardList(posts: posts),
                loading: () => const _LoadingSkeleton(height: 300),
                error: (err, stack) => _ErrorWidget(error: err),
              ),
              const SizedBox(height: AppSpacing.xxl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnalyticsDrawer(BuildContext context, WidgetRef ref) {
    final post = ref.watch(selectedPostProvider);
    
    if (post == null) {
      return Drawer(
        backgroundColor: context.colors.surface,
        width: 340,
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    return Drawer(
      backgroundColor: context.colors.surface,
      width: 340,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Analytics: ${post.title}', 
                      style: AppTypography.titleLarge.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: context.colors.textSecondary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Divider(color: context.colors.borderLight.withOpacity(0.1)),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  Text('Reach & Engagement', style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold)),
                  const SizedBox(height: AppSpacing.md),
                  _buildDrawerMetric(context, Icons.visibility_rounded, 'Total Reach', _formatNumber(post.metrics.impressions)),
                  _buildDrawerMetric(context, Icons.favorite_rounded, 'Likes', _formatNumber(post.metrics.likes)),
                  _buildDrawerMetric(context, Icons.chat_bubble_rounded, 'Comments', _formatNumber(post.metrics.comments)),
                  _buildDrawerMetric(context, Icons.send_rounded, 'Shares', _formatNumber(post.metrics.shares)),
                  _buildDrawerMetric(context, Icons.bookmark_rounded, 'Saves', _formatNumber(post.metrics.saves)),
                  
                  const SizedBox(height: AppSpacing.xl),
                  Text('Conversion', style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold)),
                  const SizedBox(height: AppSpacing.md),
                  _buildDrawerMetric(context, Icons.touch_app_rounded, 'Click Through Rate', '${post.metrics.ctr}%'),
                  _buildDrawerMetric(context, Icons.person_add_rounded, 'Leads Generated', _formatNumber(post.metrics.leads)),
                  _buildDrawerMetric(context, Icons.forum_rounded, 'Messages Started', _formatNumber(post.metrics.messages)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000) return '${(number / 1000).toStringAsFixed(1)}k';
    return number.toString();
  }

  Widget _buildDrawerMetric(BuildContext context, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: context.colors.surfaceSecondary, borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 16, color: context.colors.primaryAccent),
              ),
              const SizedBox(width: 12),
              Text(label, style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
            ],
          ),
          Text(value, style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildPeriodSelector(BuildContext context, WidgetRef ref) {
    final currentPeriod = ref.watch(dashboardPeriodProvider);
    
    return PopupMenuButton<int>(
      initialValue: currentPeriod,
      icon: Icon(Icons.calendar_today_rounded, color: context.colors.textSecondary, size: 20),
      color: context.colors.surfaceSecondary,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onSelected: (value) {
        ref.read(dashboardPeriodProvider.notifier).state = value;
      },
      itemBuilder: (context) => [
        _buildPopupItem(context, 7, 'Last 7 Days', currentPeriod),
        _buildPopupItem(context, 30, 'Last 30 Days', currentPeriod),
        _buildPopupItem(context, 90, 'Last 90 Days', currentPeriod),
      ],
    );
  }

  PopupMenuItem<int> _buildPopupItem(BuildContext context, int value, String label, int current) {
    return PopupMenuItem<int>(
      value: value,
      child: Text(
        label,
        style: AppTypography.bodyMedium.copyWith(
          color: value == current ? context.colors.primaryAccent : context.colors.textPrimary,
          fontWeight: value == current ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
    );
  }
}

class _LoadingSkeleton extends StatelessWidget {
  final double height;
  const _LoadingSkeleton({required this.height});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(child: CircularProgressIndicator()),
    );
  }
}

class _ErrorWidget extends StatelessWidget {
  final Object error;
  const _ErrorWidget({required this.error});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline_rounded, color: context.colors.error),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Failed to load data: $error',
              style: AppTypography.bodySmall.copyWith(color: context.colors.error),
            ),
          ),
        ],
      ),
    );
  }
}
