import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/user_profile_models.dart';

class ProfileTabBar extends StatelessWidget {
  final ProfileTab currentTab;
  final ValueChanged<ProfileTab> onTabChanged;

  const ProfileTabBar({
    super.key,
    required this.currentTab,
    required this.onTabChanged,
  });

  @override
  Widget build(BuildContext context) {
    final tabs = [
      {'tab': ProfileTab.saved, 'label': 'Saved'},
      {'tab': ProfileTab.collections, 'label': 'Collections'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: AppSpacing.borderRadiusLg,
          border: Border.all(color: context.colors.borderLight, width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: tabs.map((t) {
            final tab = t['tab'] as ProfileTab;
            final label = t['label'] as String;
            final isSelected = currentTab == tab;

            return GestureDetector(
              onTap: () => onTabChanged(tab),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? context.colors.primaryAccent : Colors.transparent,
                  borderRadius: AppSpacing.borderRadiusMd,
                  border: Border.all(
                    color: isSelected ? context.colors.primaryAccent : Colors.transparent,
                    width: 0.5,
                  ),
                ),
                child: Text(
                  label,
                  style: AppTypography.labelLarge.copyWith(
                    color: isSelected ? Colors.white : context.colors.textSecondary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
