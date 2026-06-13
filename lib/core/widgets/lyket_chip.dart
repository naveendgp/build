import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/haptics.dart';

/// Premium selection chip with animated state transitions
class LyketChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final IconData? icon;

  const LyketChip({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Haptics.selection();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm + 2,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? context.colors.primaryAccent.withValues(alpha: 0.15)
              : context.colors.surface,
          borderRadius: AppSpacing.borderRadiusFull,
          border: Border.all(
            color: isSelected
                ? context.colors.primaryAccent.withValues(alpha: 0.5)
                : context.colors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 16,
                color: isSelected ? context.colors.primaryAccent : context.colors.textSecondary,
              ),
              const SizedBox(width: AppSpacing.xs + 2),
            ],
            Text(
              label,
              style: AppTypography.labelLarge.copyWith(
                color: isSelected ? context.colors.primaryAccent : context.colors.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: AppSpacing.xs + 2),
              Icon(
                Icons.check_rounded,
                size: 14,
                color: context.colors.primaryAccent,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
