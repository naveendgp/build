import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../providers/lead_api_provider.dart';

class FormsTab extends ConsumerWidget {
  const FormsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formsAsync = ref.watch(brandFormsProvider);

    return formsAsync.when(
      loading: () => Center(child: CircularProgressIndicator(color: context.colors.primaryAccent)),
      error: (err, stack) => Center(child: Text('Failed to load forms', style: TextStyle(color: context.colors.error))),
      data: (forms) {
        if (forms.isEmpty) {
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

        return RefreshIndicator(
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
                    color: isActive ? context.colors.primaryAccent.withValues(alpha: 0.3) : context.colors.borderLight.withValues(alpha: 0.1),
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
                              color: isActive ? context.colors.textPrimary : context.colors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                isActive ? 'Active' : 'Archived (Inactive)',
                                style: AppTypography.bodySmall.copyWith(
                                  color: isActive ? context.colors.success : context.colors.textTertiary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              if (form.postTitle != null) ...[
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 6),
                                  child: Icon(Icons.circle, size: 4, color: context.colors.textTertiary),
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
                                  child: Icon(Icons.circle, size: 4, color: context.colors.textTertiary),
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
                    Switch(
                      value: isActive,
                      activeColor: context.colors.primaryAccent,
                      onChanged: (val) async {
                        try {
                          await ref.read(leadApiServiceProvider).toggleFormStatus(form.id, !val);
                          ref.invalidate(brandFormsProvider);
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: Text('Failed to update status'),
                              backgroundColor: context.colors.error,
                            ));
                          }
                        }
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}
