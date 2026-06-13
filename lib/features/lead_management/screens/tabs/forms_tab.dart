import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../form_builder_screen.dart';

class FormsTab extends StatelessWidget {
  const FormsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_add, size: 64, color: context.colors.textTertiary),
          const SizedBox(height: AppSpacing.md),
          Text(
            'No forms created yet.',
            style: AppTypography.titleMedium.copyWith(color: context.colors.textSecondary),
          ),
          const SizedBox(height: AppSpacing.lg),
          GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const FormBuilderScreen()),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 10),
              decoration: BoxDecoration(
                color: context.colors.primaryAccent.withValues(alpha: 0.1),
                border: Border.all(color: context.colors.primaryAccent.withValues(alpha: 0.3)),
                borderRadius: AppSpacing.borderRadiusFull,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.add_rounded, size: 16, color: context.colors.primaryAccent),
                  const SizedBox(width: 6),
                  Text(
                    'Create Form',
                    style: AppTypography.labelMedium.copyWith(
                      color: context.colors.primaryAccent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
