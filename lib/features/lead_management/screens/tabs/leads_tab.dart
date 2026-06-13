import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../widgets/leads_table_view.dart';
import '../../providers/lead_api_provider.dart';

class LeadsTab extends ConsumerStatefulWidget {
  const LeadsTab({super.key});

  @override
  ConsumerState<LeadsTab> createState() => _LeadsTabState();
}

class _LeadsTabState extends ConsumerState<LeadsTab> {
  String? selectedPostId;

  @override
  Widget build(BuildContext context) {
    final statsAsync = ref.watch(brandLeadStatsProvider);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: statsAsync.when(
            data: (stats) {
              if (stats.posts.isEmpty) {
                return const Text('No active campaigns found.');
              }
              selectedPostId ??= stats.posts.first.postId;

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: AppSpacing.borderRadiusLg,
                  border: Border.all(color: context.colors.borderLight.withValues(alpha: 0.2)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: selectedPostId,
                    isExpanded: true,
                    dropdownColor: context.colors.card,
                    icon: Icon(Icons.keyboard_arrow_down_rounded, color: context.colors.textSecondary),
                    borderRadius: AppSpacing.borderRadiusLg,
                    items: stats.posts.map((p) => DropdownMenuItem(
                      value: p.postId,
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: context.colors.primaryAccent.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.campaign_rounded, size: 14, color: context.colors.primaryAccent),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              p.postTitle ?? 'Campaign ${p.postId.substring(0, 8)}',
                              style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (selectedPostId == p.postId)
                            Icon(Icons.check_circle_rounded, size: 16, color: context.colors.success),
                        ],
                      ),
                    )).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => selectedPostId = val);
                    },
                  ),
                ),
              );
            },
            loading: () => Center(child: CircularProgressIndicator(color: context.colors.primaryAccent)),
            error: (err, stack) => Center(child: Text('Error loading campaigns', style: TextStyle(color: context.colors.error))),
          ),
        ),
        Expanded(
          child: selectedPostId == null
              ? const Center(child: Text('Please select a campaign'))
              : ref.watch(postLeadsProvider(selectedPostId!)).when(
                  data: (leads) => LeadsTableView(leads: leads),
                  loading: () => Center(child: CircularProgressIndicator(color: context.colors.primaryAccent)),
                  error: (err, stack) => Center(child: Text('Error loading leads', style: TextStyle(color: context.colors.error))),
                ),
        ),
      ],
    );
  }
}
