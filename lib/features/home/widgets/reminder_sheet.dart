import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/app_messenger.dart';
import '../providers/feed_provider.dart';

/// "Set Reminder" — a date and time, or one of the usual intervals.
///
/// The home feed and the post detail screen each carried their own copy of
/// this, and Explore's bell was wired to an empty callback, so it did nothing
/// at all. One sheet now serves all three.
Future<void> showPostReminderSheet(BuildContext context, WidgetRef ref, String postId) {
  final notifier = ref.read(feedProvider.notifier);
  final parentContext = context;

  Future<void> set(DateTime when, String label) async {
    final ok = await notifier.setReminder(postId, when);
    if (!parentContext.mounted) return;
    if (ok) {
      AppMessenger.of(
        parentContext,
      ).showSnackBar(SnackBar(content: Text('Reminder set for $label')));
    } else {
      // Saying "set" for a reminder the server never stored is worse than
      // saying nothing.
      AppMessenger.of(parentContext).showError('Could not set that reminder. Please try again.');
    }
  }

  Widget option(BuildContext sheetContext, String label, Duration after) {
    return ListTile(
      title: Text(label, style: AppTypography.bodyLarge),
      trailing: Icon(
        Icons.notifications_active_outlined,
        color: sheetContext.colors.textSecondary,
      ),
      onTap: () {
        Navigator.pop(sheetContext);
        set(DateTime.now().add(after), label);
      },
    );
  }

  return showModalBottomSheet(
    context: parentContext,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(sheetContext).size.height * 0.85),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).padding.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.colors.border,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text('Set Reminder', style: AppTypography.titleLarge),
            ),
            ListTile(
              title: Text('Custom date & time', style: AppTypography.bodyLarge),
              trailing: Icon(Icons.calendar_today_rounded, color: context.colors.textSecondary),
              onTap: () async {
                Navigator.pop(sheetContext);
                final date = await showAdaptiveDatePicker(
                  parentContext,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date == null || !parentContext.mounted) return;
                final time = await showAdaptiveTimePicker(
                  parentContext,
                  initialTime: TimeOfDay.now(),
                );
                if (time == null || !parentContext.mounted) return;
                final when = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                await set(
                  when,
                  '${when.day}/${when.month}/${when.year} at ${time.format(parentContext)}',
                );
              },
            ),
            option(sheetContext, 'Tomorrow', const Duration(days: 1)),
            option(sheetContext, '3 days after', const Duration(days: 3)),
            option(sheetContext, '7 days after', const Duration(days: 7)),
            option(sheetContext, '14 days after', const Duration(days: 14)),
            option(sheetContext, '30 days after', const Duration(days: 30)),
            const SizedBox(height: 32),
          ],
        ),
      ),
    ),
  );
}
