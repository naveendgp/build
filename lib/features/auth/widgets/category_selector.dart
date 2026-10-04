import 'package:flutter/material.dart';
import '../../../core/constants/brand_categories.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

class CategorySelector extends StatelessWidget {
  final String? selectedCategory;
  final ValueChanged<String> onSelect;

  const CategorySelector({super.key, required this.selectedCategory, required this.onSelect});

  /// The categories the whole product uses. This screen had eleven of its
  /// own — Technology, Entertainment, Finance, Other — none of which the web
  /// offers, so a brand signing up here picked something Settings could not
  /// show back to it.
  static const Map<String, IconData> _icons = {
    'Retail & Shopping': Icons.storefront_rounded,
    'Food & Beverages': Icons.restaurant_rounded,
    'Health & Wellness': Icons.favorite_rounded,
    'Education & Learning': Icons.school_rounded,
    'Travel & Hospitality': Icons.flight_takeoff_rounded,
    'Professional & Business Services': Icons.work_outline_rounded,
    'Automobiles': Icons.directions_car_rounded,
    'Real Estate': Icons.apartment_rounded,
    'Art, Craft & Culture': Icons.palette_rounded,
    'Kids & Parenting': Icons.child_care_rounded,
    'Pets': Icons.pets_rounded,
    'Local Services': Icons.handyman_rounded,
    'Spiritual & Religious': Icons.self_improvement_rounded,
    'Tech & Startups': Icons.devices_rounded,
    'Others': Icons.more_horiz_rounded,
  };

  static List<Map<String, dynamic>> get categories => [
    for (final name in brandCategoryNames)
      {'label': name, 'icon': _icons[name] ?? Icons.storefront_rounded},
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
