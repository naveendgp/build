import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../providers/notifications_provider.dart';
import '../widgets/notification_card.dart';
import '../widgets/notification_states.dart';
import '../models/notification_models.dart';
import '../../user_profile/providers/reminders_provider.dart';
import '../../../core/network/api_client.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);
    final notifier = ref.read(notificationsProvider.notifier);

    return Scaffold(
      backgroundColor: context.colors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context, state, notifier),
            _buildFilterTabs(context, state, notifier),
            Expanded(
              child: _buildListContent(context, ref, state, notifier),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, NotificationsState state, NotificationsNotifier notifier) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.sm),
      child: Row(
        children: [
          IconButton(
            icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: AppSpacing.xs),
          Text(
            'Notifications',
            style: AppTypography.headlineSmall.copyWith(
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
          const Spacer(),
          if (state.unreadCount > 0)
            Container(
              margin: const EdgeInsets.only(right: AppSpacing.sm),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: context.colors.primaryAccent,
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
              ),
              child: Text(
                '${state.unreadCount} New',
                style: AppTypography.labelSmall.copyWith(
                  color: context.colors.background,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          IconButton(
            icon: Icon(Icons.done_all_rounded, color: context.colors.textSecondary, size: 22),
            tooltip: 'Mark all as read',
            onPressed: () {
              Haptics.light();
              notifier.markAllAsRead();
            },
          ),
          IconButton(
            icon: Icon(Icons.delete_sweep_rounded, color: context.colors.error, size: 22),
            tooltip: 'Clear all notifications',
            onPressed: () {
              Haptics.light();
              notifier.clearAllNotifications();
            },
          ),
        ],
      ),
    );
  }


  Widget _buildFilterTabs(BuildContext context, NotificationsState state, NotificationsNotifier notifier) {
    final filters = [
      {'label': 'All', 'value': NotificationFilter.all},
      {'label': 'Reminders', 'value': NotificationFilter.reminders},
      {'label': 'Brands', 'value': NotificationFilter.brands},
      {'label': 'Messages', 'value': NotificationFilter.messages},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      child: Row(
        children: filters.map((filter) {
          final isSelected = state.activeFilter == filter['value'];
          return Padding(
            padding: const EdgeInsets.only(right: AppSpacing.sm),
            child: GestureDetector(
              onTap: () {
                Haptics.selection();
                notifier.setFilter(filter['value'] as NotificationFilter);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? context.colors.textPrimary : context.colors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                  border: Border.all(
                    color: isSelected ? context.colors.textPrimary : context.colors.border,
                    width: 0.5,
                  ),
                ),
                child: Text(
                  filter['label'] as String,
                  style: AppTypography.labelMedium.copyWith(
                    color: isSelected ? context.colors.background : context.colors.textSecondary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildListContent(BuildContext context, WidgetRef ref, NotificationsState state, NotificationsNotifier notifier) {
    final bool showUpcoming = state.activeFilter == NotificationFilter.reminders;
    final upcomingState = ref.watch(remindersProvider);
    final hasUpcoming = showUpcoming && upcomingState.reminders.isNotEmpty;

    if (state.isLoading && !hasUpcoming) {
      return const SingleChildScrollView(
        child: NotificationSkeleton(),
      );
    }

    final notifications = notifier.filteredNotifications;

    if (notifications.isEmpty && !hasUpcoming) {
      return const SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.only(top: 100),
          child: NotificationEmptyState(),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.only(top: AppSpacing.sm, bottom: 120),
      children: [
        if (hasUpcoming) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
            child: Text('Upcoming', style: AppTypography.titleSmall.copyWith(color: context.colors.textSecondary)),
          ),
          ...upcomingState.reminders.map((reminder) => _buildUpcomingCard(context, ref, reminder)),
          if (notifications.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
              child: Text('Past Reminders', style: AppTypography.titleSmall.copyWith(color: context.colors.textSecondary)),
            ),
        ],
        ...notifications.map((notification) => NotificationCard(
          notification: notification,
          onTap: () {
            if (notification.referenceId != null) {
              final eType = notification.entityType?.toLowerCase();
              if (eType == 'post' || notification.type == NotificationType.social) {
                context.push('/explore/post', extra: notification.referenceId);
              } else if (eType == 'user') {
                // Future: handle user routing
              } else if (eType == 'conversation' || notification.type == NotificationType.message) {
                context.push('/messages/${notification.referenceId}');
              } else if (notification.type == NotificationType.brand || eType == 'brand') {
                context.push('/brand/${notification.referenceId}');
              }
            }
          },
          onDismiss: () {
            Haptics.medium();
            notifier.deleteNotification(notification.id);
          },
          onMarkRead: () => notifier.markAsRead(notification.id),
        )),
      ],
    );
  }

  Widget _buildUpcomingCard(BuildContext context, WidgetRef ref, UpcomingReminder reminder) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: context.colors.border, width: 0.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: context.colors.background,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: context.colors.border, width: 0.5),
            ),
            clipBehavior: Clip.antiAlias,
            child: reminder.post != null
                ? CachedNetworkImage(
                    imageUrl: reminder.post!.mediaUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(color: context.colors.surface),
                    errorWidget: (context, url, error) => Icon(Icons.alarm_rounded, color: context.colors.primaryAccent),
                  )
                : Icon(Icons.alarm_rounded, color: context.colors.primaryAccent),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Scheduled: ${reminder.title}',
                  style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, color: context.colors.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Due ${timeago.format(reminder.reminderTime, allowFromNow: true)}',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.primaryAccent, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          IconButton(
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
            icon: Icon(Icons.edit_rounded, color: context.colors.primaryAccent, size: 20),
            onPressed: () async {
              Haptics.selection();
              final date = await showDatePicker(
                context: context,
                initialDate: reminder.reminderTime,
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (date != null && context.mounted) {
                final time = await showTimePicker(
                  context: context,
                  initialTime: TimeOfDay.fromDateTime(reminder.reminderTime),
                );
                if (time != null && context.mounted) {
                  final newDateTime = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                  try {
                    final apiClient = ref.read(apiClientProvider);
                    await apiClient.dio.put('/reminders/${reminder.id}', data: {
                      'reminderTime': newDateTime.toIso8601String(),
                    });
                    ref.read(remindersProvider.notifier).loadReminders();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Reminder updated successfully')),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed to update reminder: $e')),
                      );
                    }
                  }
                }
              }
            },
          ),
        ],
      ),
    );
  }
}
