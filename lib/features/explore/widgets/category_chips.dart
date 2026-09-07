import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../models/explore_models.dart';

// Lyket Explore — Category Discovery Chips
class CategoryChips extends StatelessWidget {
  final List<ExploreCategory> categories;
  final String? selectedCategory;
  final ValueChanged<String?> onSelect;

  const CategoryChips({
    super.key,
    required this.categories,
    this.selectedCategory,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Explore Categories',
            style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.w600, color: context.colors.textPrimary),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Wrap(
            spacing: 10,
            runSpacing: 10,
            children: categories.map((category) {
              final isSelected = selectedCategory == category.id;
              return _CategoryChip(
                category: category,
                isSelected: isSelected,
                onTap: () {
                  Haptics.selection();
                  onSelect(isSelected ? null : category.id);
                },
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final ExploreCategory category;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.category,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? context.colors.primaryAccent.withValues(alpha: 0.15)
              : context.colors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(
            color: isSelected
                ? context.colors.primaryAccent.withValues(alpha: 0.4)
                : context.colors.border,
            width: 0.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              category.icon,
              size: 16,
              color: isSelected ? context.colors.primaryAccent : context.colors.textSecondary,
            ),
            const SizedBox(width: 4),
            Text(
              category.name,
              style: AppTypography.labelMedium.copyWith(
                color: isSelected ? context.colors.primaryAccent : context.colors.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
