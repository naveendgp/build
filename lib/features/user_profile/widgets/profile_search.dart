import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';

class ProfileSearch extends StatelessWidget {
  final ValueChanged<String> onChanged;

  const ProfileSearch({super.key, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: AppSpacing.borderRadiusFull,
          border: Border.all(color: context.colors.borderLight, width: 0.5),
        ),
        child: TextField(
          onChanged: onChanged,
          style: AppTypography.bodyLarge,
          decoration: InputDecoration(
            hintText: 'Search saved & collections...',
            hintStyle: AppTypography.bodyLarge.copyWith(color: context.colors.textTertiary),
            prefixIcon: Icon(Icons.search_rounded, color: context.colors.textSecondary),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 14),
          ),
        ),
      ),
    );
  }
}
