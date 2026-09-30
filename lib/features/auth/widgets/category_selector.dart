import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

class CategorySelector extends StatelessWidget {
  final String? selectedCategory;
  final ValueChanged<String> onSelect;

  const CategorySelector({super.key, required this.selectedCategory, required this.onSelect});

  static const List<Map<String, dynamic>> categories = [
    {'label': 'Fashion & Apparel', 'icon': Icons.checkroom_rounded},
    {'label': 'Technology', 'icon': Icons.devices_rounded},
    {'label': 'Food & Beverage', 'icon': Icons.restaurant_rounded},
    {'label': 'Health & Wellness', 'icon': Icons.favorite_rounded},
    {'label': 'Education', 'icon': Icons.school_rounded},
    {'label': 'Entertainment', 'icon': Icons.movie_rounded},
    {'label': 'Real Estate', 'icon': Icons.apartment_rounded},
    {'label': 'Automotive', 'icon': Icons.directions_car_rounded},
    {'label': 'Finance', 'icon': Icons.account_balance_rounded},
    {'label': 'Retail', 'icon': Icons.storefront_rounded},
    {'label': 'Other', 'icon': Icons.more_horiz_rounded},
  ];

  void _showSheet(BuildContext context) {
    Haptics.light();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.65),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
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
                  borderRadius: BorderRadius.circular(100),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text('Select Category', style: AppTypography.titleMedium),
            ),
            Flexible(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: categories.length,
                shrinkWrap: true,
                itemBuilder: (_, i) {
                  final cat = categories[i];
                  final label = cat['label'] as String;
                  final sel = selectedCategory == label;
                  return ListTile(
                    onTap: () {
                      Haptics.selection();
                      onSelect(label);
                      Navigator.pop(ctx);
                    },
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: sel
                            ? context.colors.primaryAccent.withValues(alpha: 0.15)
                            : context.colors.surface,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        cat['icon'] as IconData,
                        size: 20,
                        color: sel ? context.colors.primaryAccent : context.colors.textSecondary,
                      ),
                    ),
                    title: Text(
                      label,
                      style: AppTypography.labelLarge.copyWith(
                        color: sel ? context.colors.primaryAccent : context.colors.textPrimary,
                      ),
                    ),
                    trailing: sel
                        ? Icon(Icons.check_rounded, size: 20, color: context.colors.primaryAccent)
                        : null,
                  );
                },
              ),
            ),
            SizedBox(height: MediaQuery.of(ctx).padding.bottom + 12),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showSheet(context),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: AppSpacing.borderRadiusMd,
          border: Border.all(color: context.colors.border, width: 1),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                selectedCategory ?? 'Select Category',
                style: AppTypography.bodyLarge.copyWith(
                  color: selectedCategory != null
                      ? context.colors.textPrimary
                      : context.colors.textTertiary,
                ),
              ),
            ),
            Icon(Icons.keyboard_arrow_down_rounded, size: 22, color: context.colors.textTertiary),
          ],
        ),
      ),
    );
  }
}
