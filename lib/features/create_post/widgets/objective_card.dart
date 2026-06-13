import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/create_post_models.dart';

class ObjectiveCard extends StatelessWidget {
  final ObjectiveMeta meta;
  final bool isSelected;
  final VoidCallback onTap;

  const ObjectiveCard({
    super.key,
    required this.meta,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor = isSelected ? meta.accentColor : context.colors.border;
    final backgroundColor = isSelected
        ? meta.accentColor.withValues(alpha: 0.08)
        : context.colors.card;
    final iconColor = isSelected ? meta.accentColor : context.colors.textSecondary;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: AppSpacing.borderRadiusXl,
          border: Border.all(color: borderColor, width: isSelected ? 2.0 : 1.0),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: meta.accentColor.withValues(alpha: 0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  )
                ]
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(meta.icon, size: 32, color: iconColor),
            const SizedBox(height: AppSpacing.sm),
            Text(
              meta.title,
              style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              meta.subtitle,
              style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              meta.outcome,
              style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
