import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/reminders_provider.dart';
import '../widgets/reminders_section.dart';

/// Full-page listing of the reminders the user has set on posts so far.
/// Reuses [RemindersSection]'s loading/error/empty/list states — that
/// widget already covers everything needed here, just embedded without
/// its own card chrome since it now IS the page.
class RemindersScreen extends ConsumerWidget {
  const RemindersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Reminders',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(allRemindersProvider.notifier).loadReminders(),
        child: ListView(
          padding: const EdgeInsets.only(top: 8, bottom: 32),
          children: [
            RemindersSection(provider: allRemindersProvider, emptyText: 'No reminders yet.'),
          ],
        ),
      ),
    );
  }
}
