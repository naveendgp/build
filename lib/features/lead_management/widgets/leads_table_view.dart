import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../models/lead_models.dart';
import '../screens/lead_detail_screen.dart';
import '../providers/lead_api_provider.dart';
import '../../../core/utils/app_messenger.dart';

class LeadsTableView extends ConsumerWidget {
  final List<LeadSubmission> leads;
  final String postId;

  /// Which list this is. Archived leads offer "Put back" instead of
  /// "Archive", and say something different when the list is empty.
  final bool showingArchived;

  const LeadsTableView({
    super.key,
    required this.leads,
    required this.postId,
    this.showingArchived = false,
  });

  Future<void> _setArchived(
    BuildContext context,
    WidgetRef ref,
    LeadSubmission lead,
    bool archived,
  ) async {
    try {
      await ref.read(leadApiServiceProvider).setLeadArchived(lead.id, archived);
      ref.invalidate(postLeadsProvider);
      ref.invalidate(brandLeadStatsProvider);
      if (context.mounted) {
        AppMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(archived ? 'Lead archived' : 'Lead put back')));
      }
    } catch (_) {
      // The list is left as it was; AppMessenger swallows the failure notice.
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (leads.isEmpty) {
      return Center(
        child: Text(
          showingArchived
              ? 'No archived leads for this campaign.'
              : 'No leads found for this campaign.',
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
                      Text(
                        lead.username,
                        style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.bold),
                      ),
                      if (lead.email != null)
                        Text(
                          lead.email!,
                          style: AppTypography.labelSmall.copyWith(
                            color: context.colors.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
                _buildQualityScore(context, lead.qualityScore),
                IconButton(
                  onPressed: () => _setArchived(context, ref, lead, !showingArchived),
                  tooltip: showingArchived ? 'Put back' : 'Archive',
                  icon: Icon(
                    showingArchived ? Icons.restore_rounded : Icons.archive_outlined,
                    size: 20,
                    color: context.colors.textSecondary,
                  ),
                ),
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
        style: AppTypography.labelSmall.copyWith(color: color, fontWeight: FontWeight.bold),
      ),
    );
  }
}
