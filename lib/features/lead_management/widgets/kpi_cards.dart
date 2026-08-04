import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';

class KpiCardsSection extends StatelessWidget {
  final int totalForms;
  final int activeForms;
  final int leadsGenerated;

  const KpiCardsSection({
    super.key,
    required this.totalForms,
    required this.activeForms,
    required this.leadsGenerated,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          _buildKpiCard(context, 
            title: 'Leads Generated',
            value: leadsGenerated.toString(),
            trend: '+12%',
            isPositiveTrend: true,
            icon: Icons.people_alt_rounded,
          ),
          const SizedBox(width: AppSpacing.md),
          _buildKpiCard(context, 
            title: 'Active Forms',
            value: '$activeForms / $totalForms',
            trend: 'Stable',
            isPositiveTrend: true,
            icon: Icons.assignment_rounded,
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard(BuildContext context, {
    required String title,
    required String value,
    required String trend,
    required bool isPositiveTrend,
    required IconData icon,
  }) {
    return Container(
      width: 170,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusXl,
        border: Border.all(
          color: isPositiveTrend 
            ? context.colors.success.withValues(alpha: 0.15) 
            : context.colors.borderLight.withValues(alpha: 0.1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1B1D22),
                  shape: BoxShape.circle,
                  border: Border.all(color: context.colors.borderLight.withValues(alpha: 0.1)),
                ),
                child: Icon(icon, color: context.colors.textPrimary, size: 20),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPositiveTrend ? context.colors.success.withValues(alpha: 0.15) : context.colors.error.withValues(alpha: 0.15),
                  borderRadius: AppSpacing.borderRadiusFull,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isPositiveTrend ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                      size: 12,
                      color: isPositiveTrend ? context.colors.success : context.colors.error,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      trend,
                      style: AppTypography.labelSmall.copyWith(
                        color: isPositiveTrend ? context.colors.success : context.colors.error,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            value,
            style: AppTypography.headlineMedium.copyWith(
              fontWeight: FontWeight.w900,
              color: context.colors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            title,
            style: AppTypography.labelMedium.copyWith(
              color: const Color(0xFFA1A1AA),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
