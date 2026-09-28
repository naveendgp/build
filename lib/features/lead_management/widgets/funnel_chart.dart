import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';

class FunnelChart extends StatelessWidget {
  final int views;
  final int submissions;

  const FunnelChart({super.key, required this.views, required this.submissions});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusLg,
        border: Border.all(color: context.colors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Conversion Funnel',
            style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: AppSpacing.xl),
          _buildFunnelStage(
            context,
            'Views',
            views,
            views,
            context.colors.primaryAccent.withValues(alpha: 0.3),
          ),
          _buildFunnelStage(
            context,
            'Submissions',
            submissions,
            views,
            context.colors.primaryAccent,
          ),
        ],
      ),
    );
  }

  Widget _buildFunnelStage(BuildContext context, String label, int value, int max, Color color) {
    final double percentage = max > 0 ? value / max : 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: AppTypography.bodyMedium.copyWith(color: const Color(0xFFA1A1AA)),
            ),
          ),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth * percentage;
                return Stack(
                  alignment: Alignment.centerLeft,
                  children: [
                    Container(
                      height: 32,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: context.colors.card,
                        borderRadius: AppSpacing.borderRadiusMd,
                      ),
                    ),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 1000),
                      curve: Curves.easeOutCubic,
                      height: 32,
                      width: width.clamp(8.0, double.infinity),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: AppSpacing.borderRadiusMd,
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          SizedBox(
            width: 60,
            child: Text(
              value.toString(),
              style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
