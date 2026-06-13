import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../providers/reminders_provider.dart';

class RemindersSection extends ConsumerWidget {
  const RemindersSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(remindersProvider);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusLg,
        border: Border.all(color: context.colors.borderLight, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Reminders', style: AppTypography.titleMedium),
              Icon(Icons.notifications_active_rounded, color: context.colors.primaryAccent, size: 20),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          if (state.isLoading)
            const Center(child: CircularProgressIndicator(strokeWidth: 2))
          else if (state.error != null)
            Text('Failed to load reminders.', style: AppTypography.bodyMedium.copyWith(color: context.colors.error))
          else if (state.reminders.isEmpty)
            Text('No upcoming reminders.', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary))
          else
            ListView.separated(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: state.reminders.length,
              separatorBuilder: (context, index) => Divider(color: context.colors.borderLight, height: 24),
              itemBuilder: (context, index) {
                final reminder = state.reminders[index];
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    if (reminder.post != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                          imageUrl: reminder.post!.mediaUrl,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          errorWidget: (context, url, error) => Container(
                            width: 48,
                            height: 48,
                            color: context.colors.background,
                            child: Icon(Icons.image_not_supported, size: 20, color: context.colors.textSecondary),
                          ),
                        ),
                      )
                    else
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: context.colors.primaryAccent.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.notifications, color: context.colors.primaryAccent),
                      ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            reminder.title,
                            style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Due ${timeago.format(reminder.reminderTime, allowFromNow: true)}',
                            style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}
