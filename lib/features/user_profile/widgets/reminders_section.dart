import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/haptics.dart';
import '../providers/reminders_provider.dart';
import '../../../core/utils/app_messenger.dart';

class RemindersSection extends ConsumerWidget {
  /// Which reminders list to show. Defaults to the upcoming-only list
  /// (used on the notifications bell); pass [allRemindersProvider] for the
  /// full history (used on the dedicated Reminders page).
  final StateNotifierProvider<RemindersNotifier, RemindersState>? provider;
  final String emptyText;

  const RemindersSection({super.key, this.provider, this.emptyText = 'No upcoming reminders.'});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(provider ?? remindersProvider);

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
              Icon(
                Icons.notifications_active_rounded,
                color: context.colors.primaryAccent,
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          if (state.isLoading)
            const Center(child: CircularProgressIndicator.adaptive(strokeWidth: 2))
          else if (state.error != null)
            Text(
              state.error!,
              style: AppTypography.bodyMedium.copyWith(color: context.colors.error),
            )
          else if (state.reminders.isEmpty)
            Text(
              emptyText,
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: state.reminders.length,
              separatorBuilder: (context, index) =>
                  Divider(color: context.colors.borderLight, height: 24),
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
                            child: Icon(
                              Icons.image_not_supported,
                              size: 20,
                              color: context.colors.textSecondary,
                            ),
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
                            style: AppTypography.labelMedium.copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Only upcoming (not-yet-triggered) reminders can be
                    // rescheduled — a past/triggered one has already fired.
                    if (!reminder.isTriggered)
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: Icon(
                          Icons.edit_rounded,
                          color: context.colors.primaryAccent,
                          size: 20,
                        ),
                        onPressed: () => _editReminder(context, ref, reminder),
                      ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  Future<void> _editReminder(BuildContext context, WidgetRef ref, UpcomingReminder reminder) async {
    Haptics.selection();
    final date = await showAdaptiveDatePicker(
      context,
      initialDate: reminder.reminderTime,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !context.mounted) return;

    final time = await showAdaptiveTimePicker(
      context,
      initialTime: TimeOfDay.fromDateTime(reminder.reminderTime),
    );
    if (time == null || !context.mounted) return;

    final newDateTime = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.dio.put(
        '/reminders/${reminder.id}',
        data: {
          // .toUtc() is required — a bare local-time ISO string (no 'Z') gets
          // parsed by the backend as server-local time, not phone-local time.
          // Depending on the timezone gap that can shift a genuinely-future
          // time into "the past" server-side, which the backend rejects with
          // a 500 (see setReminder in feed_provider.dart, which already does
          // this correctly for reminder creation).
          'reminderTime': newDateTime.toUtc().toIso8601String(),
        },
      );
      // Refresh whichever list is actually being shown (upcoming or full
      // history) rather than assuming — a stale list would still show the
      // old time even though the update succeeded.
      ref.read((provider ?? remindersProvider).notifier).loadReminders();
      if (context.mounted) {
        AppMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Reminder updated successfully')));
      }
    } on DioException catch (e) {
      final serverMsg = e.response?.data is Map ? e.response?.data['message'] : null;
      if (context.mounted) {
        AppMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update reminder: ${serverMsg ?? e.message}')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        AppMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to update reminder: $e')));
      }
    }
  }
}
