import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/create_post_models.dart';

class CategorySelector extends StatelessWidget {
  final String? selectedId;
  final ValueChanged<String?> onChanged;

  const CategorySelector({
    super.key,
    required this.selectedId,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: PostCategory.all.map((category) {
        final isSelected = category.id == selectedId;
        return GestureDetector(
          onTap: () {
            Haptics.selection();
            onChanged(isSelected ? null : category.id);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
            decoration: BoxDecoration(
              color: isSelected ? category.accentColor.withValues(alpha: 0.15) : context.colors.card,
              borderRadius: AppSpacing.borderRadiusFull,
              border: Border.all(
                color: isSelected ? category.accentColor : context.colors.border,
                width: isSelected ? 1.5 : 1.0,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(category.icon, size: 16, color: isSelected ? category.accentColor : context.colors.textSecondary),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  category.label,
                  style: AppTypography.labelMedium.copyWith(
                    color: isSelected ? category.accentColor : context.colors.textPrimary,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
