import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../models/brand_profile_models.dart';

class BrandAnalyticsSection extends StatelessWidget {
  final BrandAnalytics analytics;

  const BrandAnalyticsSection({super.key, required this.analytics});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: AppSpacing.paddingScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Performance Overview', style: AppTypography.titleLarge),
          const SizedBox(height: AppSpacing.md),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            childAspectRatio: 1.3,
            children: [
              _buildStatCard(
                context,
                'Impressions',
                _formatNumber(analytics.impressions),
                Icons.visibility_rounded,
                isPositive: true,
                trend: '+12.4%',
              ),
              _buildStatCard(
                context,
                'Engagement',
                '${analytics.avgEngagement}%',
                Icons.favorite_rounded,
                isPositive: true,
                trend: '+2.1%',
              ),
              _buildStatCard(
                context,
                'Saves',
                _formatNumber(analytics.totalSaves),
                Icons.bookmark_rounded,
                isPositive: false,
                trend: '-1.2%',
              ),
              _buildStatCard(
                context,
                'CTR',
                '${analytics.ctr}%',
                Icons.touch_app_rounded,
                isPositive: true,
                trend: '+0.8%',
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Audience Insights', style: AppTypography.titleLarge),
          const SizedBox(height: AppSpacing.md),
          _buildAudienceChart(context),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String title,
    String value,
    IconData icon, {
    required bool isPositive,
    required String trend,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusXl,
        border: Border.all(color: context.colors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: const Color(0xFFA1A1AA), size: AppSpacing.iconMd),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
                decoration: BoxDecoration(
                  color: isPositive
                      ? context.colors.success.withValues(alpha: 0.1)
                      : context.colors.error.withValues(alpha: 0.1),
                  borderRadius: AppSpacing.borderRadiusSm,
                ),
                child: Text(
                  trend,
                  style: AppTypography.labelSmall.copyWith(
                    color: isPositive ? context.colors.success : context.colors.error,
                  ),
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: AppTypography.headlineMedium),
              Text(title, style: AppTypography.bodySmall),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAudienceChart(BuildContext context) {
    return Container(
      padding: AppSpacing.paddingCard,
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusXl,
        border: Border.all(color: context.colors.borderLight),
      ),
      child: Column(
        children: [
          SizedBox(
            height: 200,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Mock Pie Chart
                Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF7C5CFF), width: 20),
                  ),
                ),
                Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border(
                      top: BorderSide(color: context.colors.secondaryAccent, width: 20),
                      right: BorderSide(color: context.colors.secondaryAccent, width: 20),
                    ),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Total', style: AppTypography.labelMedium),
                    Text(_formatNumber(analytics.profileViews), style: AppTypography.headlineSmall),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildLegendItem(
                context,
                '18-24',
                const Color(0xFF7C5CFF),
                '${(analytics.audienceSplit['18-24'] ?? 0) * 100}%',
              ),
              _buildLegendItem(
                context,
                '25-34',
                context.colors.secondaryAccent,
                '${(analytics.audienceSplit['25-34'] ?? 0) * 100}%',
              ),
              _buildLegendItem(
                context,
                '35-44',
                context.colors.warning,
                '${(analytics.audienceSplit['35-44'] ?? 0) * 100}%',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(BuildContext context, String label, Color color, String percentage) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: AppSpacing.xs),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelSmall),
            Text(percentage, style: AppTypography.titleSmall),
          ],
        ),
      ],
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }
}
