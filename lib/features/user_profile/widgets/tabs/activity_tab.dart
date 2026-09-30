import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../models/user_profile_models.dart';
import '../reminders_section.dart';

class ActivityTab extends StatelessWidget {
  const ActivityTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const RemindersSection(),
        ListView.builder(
          padding: const EdgeInsets.only(top: AppSpacing.sm, bottom: 120),
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          itemCount: ActivityItem.mockList.length,
          itemBuilder: (context, index) {
            final item = ActivityItem.mockList[index];
            return Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: AppSpacing.borderRadiusLg,
                  border: Border.all(color: context.colors.borderLight, width: 0.5),
                ),
                child: Row(
                  children: [
                    CircleAvatar(radius: 24, backgroundImage: NetworkImage(item.avatarUrl)),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.content,
                            style: AppTypography.bodyLarge.copyWith(
                              color: context.colors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.time,
                            style: AppTypography.labelMedium.copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(_getIconForType(item.type), color: context.colors.textTertiary, size: 20),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'like':
        return Icons.favorite_rounded;
      case 'comment':
        return Icons.chat_bubble_rounded;
      case 'follow':
        return Icons.person_add_rounded;
      default:
        return Icons.local_activity_rounded;
    }
  }
}
