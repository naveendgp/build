import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../models/lead_models.dart';
import '../screens/lead_detail_screen.dart';

class LeadsTableView extends StatelessWidget {
  final List<LeadSubmission> leads;

  const LeadsTableView({super.key, required this.leads});

  @override
  Widget build(BuildContext context) {
    if (leads.isEmpty) {
      return Center(
        child: Text(
          'No leads found for this campaign.',
          style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: leads.length,
      itemBuilder: (context, index) {
        final lead = leads[index];
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => LeadDetailScreen(lead: lead)),
            );
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: AppSpacing.sm),
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: context.colors.card,
              borderRadius: AppSpacing.borderRadiusMd,
              border: Border.all(color: context.colors.borderLight),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: context.colors.primaryAccent.withValues(alpha: 0.1),
                  child: Text(
                    lead.username.isNotEmpty ? lead.username[0].toUpperCase() : '?',
                    style: AppTypography.titleSmall.copyWith(color: context.colors.primaryAccent),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(lead.username, style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.bold)),
                      if (lead.email != null)
                        Text(lead.email!, style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary)),
                    ],
                  ),
                ),
                _buildQualityScore(context, lead.qualityScore),
                SizedBox(width: AppSpacing.md),
                Icon(Icons.chevron_right_rounded, color: context.colors.textTertiary),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildQualityScore(BuildContext context, double score) {
    Color color = context.colors.success;
    if (score < 30) {
      color = context.colors.error;
    } else if (score < 70) {
      color = context.colors.warning;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: AppSpacing.borderRadiusSm,
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        score.toStringAsFixed(0),
        style: AppTypography.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
