import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../widgets/funnel_chart.dart';
import '../../providers/lead_api_provider.dart';

class AnalyticsTab extends ConsumerWidget {
  const AnalyticsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(brandLeadStatsProvider);

    return statsAsync.when(
      data: (stats) {
        int totalViews = 0;
        for (var post in stats.posts) {
          totalViews += post.viewCount;
        }

        return ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
          physics: const BouncingScrollPhysics(),
          children: [
            FunnelChart(views: totalViews, submissions: stats.totalSubmissions),
            const SizedBox(height: AppSpacing.xxl),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator.adaptive()),
      error: (err, stack) => Center(
        child: Text('Error loading stats', style: TextStyle(color: context.colors.error)),
      ),
    );
  }
}
