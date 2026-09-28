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
  bool showArchived = false;

  /// Active and archived leads sit behind the same campaign picker: a lead is
  /// archived rather than deleted, so both lists have to be reachable.
  Widget _buildArchiveFilter() {
    Widget tab(String label, bool archived) {
      final isSelected = showArchived == archived;
      return Expanded(
        child: GestureDetector(
          onTap: () => setState(() => showArchived = archived),
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? context.colors.card : Colors.transparent,
              borderRadius: AppSpacing.borderRadiusFull,
              border: isSelected
                  ? Border.all(color: context.colors.borderLight.withValues(alpha: 0.2))
                  : null,
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: AppTypography.labelMedium.copyWith(
                color: isSelected ? context.colors.textPrimary : context.colors.textTertiary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.sm),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusFull,
        border: Border.all(color: context.colors.borderLight.withValues(alpha: 0.2)),
      ),
      child: Row(children: [tab('Active', false), tab('Archived', true)]),
    );
  }

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
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.xs,
                ),
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
                    icon: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: context.colors.textSecondary,
                    ),
                    borderRadius: AppSpacing.borderRadiusLg,
                    items: stats.posts
                        .map(
                          (p) => DropdownMenuItem(
                            value: p.postId,
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: context.colors.primaryAccent.withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.campaign_rounded,
                                    size: 14,
                                    color: context.colors.primaryAccent,
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                Expanded(
                                  child: Text(
                                    p.postTitle ?? 'Campaign ${p.postId.substring(0, 8)}',
                                    style: AppTypography.titleSmall.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (selectedPostId == p.postId)
                                  Icon(
                                    Icons.check_circle_rounded,
                                    size: 16,
                                    color: context.colors.success,
                                  ),
                              ],
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => selectedPostId = val);
                    },
                  ),
                ),
              );
            },
            loading: () => Center(
              child: CircularProgressIndicator.adaptive(
                valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
              ),
            ),
            error: (err, stack) => Center(
              child: Text('Error loading campaigns', style: TextStyle(color: context.colors.error)),
            ),
          ),
        ),
        _buildArchiveFilter(),
        Expanded(
          child: selectedPostId == null
              ? const Center(child: Text('Please select a campaign'))
              : ref
                    .watch(postLeadsProvider((postId: selectedPostId!, archived: showArchived)))
                    .when(
                      data: (leads) => LeadsTableView(
                        leads: leads,
                        postId: selectedPostId!,
                        showingArchived: showArchived,
                      ),
                      loading: () => Center(
                        child: CircularProgressIndicator.adaptive(
                          valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
                        ),
                      ),
                      error: (err, stack) => Center(
                        child: Text(
                          'Error loading leads',
                          style: TextStyle(color: context.colors.error),
                        ),
                      ),
                    ),
        ),
      ],
    );
  }
}
