import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/dashboard_models.dart';

class DashboardKpiCards extends StatelessWidget {
  final DashboardSummary summary;

  const DashboardKpiCards({super.key, required this.summary});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _KpiCard(
                title: 'Followers',
                value: _formatNumber(summary.followers.value),
                growth: summary.followers.growth,
                icon: Icons.people_alt_rounded,
                delay: 0,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _KpiCard(
                title: 'Leads',
                value: _formatNumber(summary.leads.value),
                growth: summary.leads.growth,
                icon: Icons.person_add_alt_1_rounded,
                delay: 100,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
              child: _KpiCard(
                title: 'Impressions',
                value: _formatNumber(summary.impressions.value),
                growth: summary.impressions.growth,
                icon: Icons.visibility_rounded,
                delay: 200,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _KpiCard(
                title: 'Messages',
                value: _formatNumber(summary.messages.value),
                growth: summary.messages.growth,
                icon: Icons.forum_rounded,
                delay: 300,
              ),
            ),
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

class _KpiCard extends StatelessWidget {
  final String title;
  final String value;
  final double growth;
  final IconData icon;
  final int delay;

  const _KpiCard({
    required this.title,
    required this.value,
    required this.growth,
    required this.icon,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = growth >= 0;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: context.colors.borderLight.withOpacity(0.1),
        ),
        boxShadow: context.shadows.layer1,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.labelLarge.copyWith(
                    color: context.colors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: context.colors.primaryAccent),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            value,
            style: AppTypography.headlineMedium.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Icon(
                isPositive ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                size: 16,
                color: isPositive ? context.colors.success : context.colors.error,
              ),
              const SizedBox(width: 4),
              Text(
                '${growth.abs().toStringAsFixed(1)}%',
                style: AppTypography.labelMedium.copyWith(
                  color: isPositive ? context.colors.success : context.colors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'vs last 30d',
                  style: AppTypography.labelSmall.copyWith(
                    color: context.colors.textTertiary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: delay.ms, duration: 400.ms).slideY(begin: 0.1, end: 0, delay: delay.ms, duration: 400.ms, curve: Curves.easeOutQuad);
  }
}
