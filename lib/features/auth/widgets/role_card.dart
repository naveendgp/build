import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/lyket_card.dart';

/// Premium role selection card for Auth Landing
/// Glassmorphic floating card with icon, title, and description
class RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool isSelected;
  final VoidCallback onTap;

  const RoleCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return LyketCard(
      onTap: onTap,
      isSelected: isSelected,
      useGlass: true,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          // Icon container
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isSelected
                  ? context.colors.primaryAccent.withValues(alpha: 0.15)
                  : context.colors.surface,
              borderRadius: AppSpacing.borderRadiusLg,
              border: Border.all(
                color: isSelected
                    ? context.colors.primaryAccent.withValues(alpha: 0.3)
                    : context.colors.border,
                width: 1,
              ),
            ),
            child: Icon(
              icon,
              size: 26,
              color: isSelected ? context.colors.primaryAccent : context.colors.textSecondary,
            ),
          ),

          const SizedBox(width: AppSpacing.md),

          // Text content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.titleSmall.copyWith(
                    color: isSelected
                        ? context.colors.textPrimary
                        : context.colors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: AppTypography.bodySmall.copyWith(
                    color: context.colors.textTertiary,
                  ),
                ),
              ],
            ),
          ),

          // Selection indicator
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isSelected
                  ? context.colors.primaryAccent
                  : Colors.transparent,
              border: Border.all(
                color: isSelected
                    ? context.colors.primaryAccent
                    : context.colors.textTertiary,
                width: isSelected ? 0 : 1.5,
              ),
            ),
            child: isSelected
                ? const Icon(
                    Icons.check_rounded,
                    size: 16,
                    color: Colors.white,
                  )
                : null,
          ),
        ],
      ),
    );
  }
}
