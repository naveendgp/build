import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

class SubCategorySelector extends StatelessWidget {
  final String? selectedCategory;
  final String? selectedSubCategory;
  final ValueChanged<String> onSelect;

  const SubCategorySelector({
    super.key,
    required this.selectedCategory,
    required this.selectedSubCategory,
    required this.onSelect,
  });

  static const Map<String, List<String>> subCategories = {
    'Fashion & Apparel': ['Men\'s Clothing', 'Women\'s Clothing', 'Kids\' & Baby Clothing', 'Shoes & Footwear', 'Accessories', 'Jewelry & Watches', 'Sportswear'],
    'Technology': ['Software / SaaS', 'Consumer Electronics', 'IT Services', 'Mobile Apps', 'AI & Machine Learning', 'Hardware', 'Web3 & Blockchain'],
    'Food & Beverage': ['Restaurant', 'Cafe / Coffee Shop', 'Bakery', 'Grocery', 'Beverage / Alcohol', 'Fast Food', 'Catering'],
    'Health & Wellness': ['Gym & Fitness', 'Yoga & Pilates', 'Spa / Salon', 'Healthcare / Clinic', 'Supplements', 'Mental Health', 'Personal Care'],
    'Education': ['K-12 School', 'University / College', 'Online Courses', 'Tutoring', 'Professional Training', 'Educational Materials'],
    'Entertainment': ['Gaming & Esports', 'Movies & TV', 'Music & Podcasts', 'Events & Ticketing', 'Nightlife', 'Performing Arts', 'Streaming'],
    'Real Estate': ['Residential Sales', 'Commercial Property', 'Property Management', 'Real Estate Agency', 'Co-working Spaces', 'Architecture & Design'],
    'Automotive': ['Car Dealership', 'Auto Repair', 'Car Rental', 'Auto Parts', 'Electric Vehicles', 'Motorcycle'],
    'Finance': ['Banking', 'Wealth Management', 'Insurance', 'Accounting & Tax', 'FinTech & Crypto', 'Lending & Mortgages'],
    'Retail': ['Home & Garden', 'Beauty & Cosmetics', 'Sports & Outdoors', 'Toys & Hobbies', 'Pet Supplies', 'Books & Stationery', 'Superstore'],
  };

  void _showSheet(BuildContext context, List<String> subs) {
    Haptics.light();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(ctx).size.height * 0.65,
        ),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(width: 40, height: 4,
                decoration: BoxDecoration(color: context.colors.border, borderRadius: BorderRadius.circular(100))),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text('Select Sub-Category', style: AppTypography.titleMedium),
            ),
            Flexible(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: subs.length,
                shrinkWrap: true,
                itemBuilder: (_, i) {
                  final label = subs[i];
                  final sel = selectedSubCategory == label;
                  return ListTile(
                    onTap: () { Haptics.selection(); onSelect(label); Navigator.pop(ctx); },
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    title: Text(label, style: AppTypography.labelLarge.copyWith(
                      color: sel ? context.colors.primaryAccent : context.colors.textPrimary)),
                    trailing: sel ? Icon(Icons.check_rounded, size: 20, color: context.colors.primaryAccent) : null,
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
    final subs = selectedCategory != null ? subCategories[selectedCategory!] ?? [] : <String>[];
    if (subs.isEmpty) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () => _showSheet(context, subs),
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
            Expanded(child: Text(
              selectedSubCategory ?? 'Select Sub-Category (Optional)',
              style: AppTypography.bodyLarge.copyWith(
                color: selectedSubCategory != null ? context.colors.textPrimary : context.colors.textTertiary),
            )),
            Icon(Icons.keyboard_arrow_down_rounded, size: 22, color: context.colors.textTertiary),
          ],
        ),
      ),
    );
  }
}
