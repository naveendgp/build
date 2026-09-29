import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/create_post_models.dart';

class ScheduleStep extends StatelessWidget {
  final PublishMode publishMode;
  final DateTime? scheduledAt;
  final ValueChanged<PublishMode> onModeChanged;
  final ValueChanged<DateTime> onDateChanged;

  const ScheduleStep({
    super.key,
    required this.publishMode,
    required this.scheduledAt,
    required this.onModeChanged,
    required this.onDateChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Publishing', style: AppTypography.headlineMedium),
          const SizedBox(height: AppSpacing.xs),
          Text('When do you want to publish this post?', style: AppTypography.bodyMedium),
          const SizedBox(height: AppSpacing.xl),
          _RadioOption(
            title: 'Publish Now',
            subtitle: 'Post will be visible immediately',
            icon: Icons.flash_on_rounded,
            isSelected: publishMode == PublishMode.now,
            onTap: () {
              Haptics.selection();
              onModeChanged(PublishMode.now);
            },
          ),
          const SizedBox(height: AppSpacing.md),
          _RadioOption(
            title: 'Schedule for Later',
            subtitle: 'Choose a specific date and time',
            icon: Icons.calendar_month_rounded,
            isSelected: publishMode == PublishMode.scheduled,
            onTap: () {
              Haptics.selection();
              onModeChanged(PublishMode.scheduled);
            },
          ),
          if (publishMode == PublishMode.scheduled) ...[
            const SizedBox(height: AppSpacing.xl),
            Text('Scheduled Date & Time', style: AppTypography.labelLarge),
            const SizedBox(height: AppSpacing.sm),
            GestureDetector(
              onTap: () async {
                Haptics.light();
                final date = await showAdaptiveDatePicker(
                  context,
                  initialDate: scheduledAt ?? DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null && context.mounted) {
                  final time = await showAdaptiveTimePicker(
                    context,
                    initialTime: TimeOfDay.fromDateTime(scheduledAt ?? DateTime.now()),
                  );
                  if (time != null) {
                    onDateChanged(
                      DateTime(date.year, date.month, date.day, time.hour, time.minute),
                    );
                  }
                }
              },
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: context.colors.card,
                  borderRadius: AppSpacing.borderRadiusLg,
                  border: Border.all(color: context.colors.border),
                ),
                child: Row(
                  children: [
                    Icon(Icons.access_time_rounded, color: context.colors.textSecondary),
                    const SizedBox(width: AppSpacing.md),
                    Text(
                      scheduledAt?.toString() ?? 'Select date and time',
                      style: AppTypography.bodyMedium.copyWith(
                        color: scheduledAt != null
                            ? context.colors.textPrimary
                            : context.colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _RadioOption extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _RadioOption({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isSelected
              ? context.colors.primaryAccent.withValues(alpha: 0.1)
              : context.colors.card,
          borderRadius: AppSpacing.borderRadiusLg,
          border: Border.all(
            color: isSelected ? context.colors.primaryAccent : context.colors.border,
            width: isSelected ? 2.0 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: isSelected ? context.colors.primaryAccent : context.colors.surface,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : context.colors.textSecondary,
                size: 20,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.labelLarge.copyWith(
                      color: isSelected ? context.colors.primaryAccent : context.colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(subtitle, style: AppTypography.bodySmall),
                ],
              ),
            ),
            if (isSelected) Icon(Icons.check_circle_rounded, color: context.colors.primaryAccent),
          ],
        ),
      ),
    );
  }
}
