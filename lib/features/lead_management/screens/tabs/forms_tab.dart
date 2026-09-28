import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../core/adaptive/adaptive.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../providers/lead_api_provider.dart';
import '../../../../core/utils/app_messenger.dart';

/// Which forms the list is showing. A form is archived rather than deleted,
/// so both sets have to be reachable.
final formsFilterProvider = StateProvider<bool>((ref) => false);

class FormsTab extends ConsumerWidget {
  const FormsTab({super.key});

  Widget _buildFilter(BuildContext context, WidgetRef ref, bool showArchived) {
    Widget tab(String label, bool archived) {
      final isSelected = showArchived == archived;
      return Expanded(
        child: GestureDetector(
          onTap: () => ref.read(formsFilterProvider.notifier).state = archived,
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
      margin: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0),
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
  Widget build(BuildContext context, WidgetRef ref) {
    final formsAsync = ref.watch(brandFormsProvider);
    final showArchived = ref.watch(formsFilterProvider);

    return formsAsync.when(
      loading: () => Center(
        child: CircularProgressIndicator.adaptive(
          valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
        ),
      ),
      error: (err, stack) => Center(
        child: Text('Failed to load forms', style: TextStyle(color: context.colors.error)),
      ),
      data: (allForms) {
        final forms = allForms.where((f) => f.isArchived == showArchived).toList();
        if (allForms.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.assignment_add, size: 64, color: context.colors.textTertiary),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'No forms created yet.',
                  style: AppTypography.titleMedium.copyWith(color: context.colors.textSecondary),
                ),
              ],
            ),
          );
        }

        return Column(
          children: [
            _buildFilter(context, ref, showArchived),
            if (forms.isEmpty)
              Expanded(
                child: Center(
                  child: Text(
                    showArchived ? 'No archived forms.' : 'No active forms.',
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                  ),
                ),
              )
            else
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async => ref.refresh(brandFormsProvider),
                  color: context.colors.primaryAccent,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    itemCount: forms.length,
                    separatorBuilder: (ctx, i) => const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (ctx, index) {
                      final form = forms[index];
                      final isActive = !form.isArchived;

                      return Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: context.colors.surface,
                          borderRadius: AppSpacing.borderRadiusLg,
                          border: Border.all(
                            color: isActive
                                ? context.colors.primaryAccent.withValues(alpha: 0.3)
                                : context.colors.borderLight.withValues(alpha: 0.1),
                            width: isActive ? 1 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    form.name ?? form.title,
                                    style: AppTypography.titleMedium.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: isActive
                                          ? context.colors.textPrimary
                                          : context.colors.textSecondary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Text(
                                        isActive ? 'Active' : 'Archived (Inactive)',
                                        style: AppTypography.bodySmall.copyWith(
                                          color: isActive
                                              ? context.colors.success
                                              : context.colors.textTertiary,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      if (form.postTitle != null) ...[
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 6),
                                          child: Icon(
                                            Icons.circle,
                                            size: 4,
                                            color: context.colors.textTertiary,
                                          ),
                                        ),
                                        Expanded(
                                          child: Text(
                                            'Post: ${form.postTitle}',
                                            style: AppTypography.bodySmall.copyWith(
                                              color: context.colors.textSecondary,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ] else ...[
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 6),
                                          child: Icon(
                                            Icons.circle,
                                            size: 4,
                                            color: context.colors.textTertiary,
                                          ),
                                        ),
                                        Text(
                                          'Template',
                                          style: AppTypography.bodySmall.copyWith(
                                            color: context.colors.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            AdaptiveSwitch(
                              value: isActive,
                              activeColor: context.colors.primaryAccent,
                              onChanged: (val) async {
                                try {
                                  await ref
                                      .read(leadApiServiceProvider)
                                      .toggleFormStatus(form.id, !val);
                                  ref.invalidate(brandFormsProvider);
                                } catch (e) {
                                  if (context.mounted) {
                                    AppMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Failed to update status'),
                                        backgroundColor: context.colors.error,
                                      ),
                                    );
                                  }
                                }
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
