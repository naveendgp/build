import 'dart:ui';
import 'package:flutter/material.dart';
import '../../models/create_post_models.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/haptics.dart';

class FormTemplatePicker extends StatelessWidget {
  final List<LeadFormTemplate> customTemplates;
  final ValueChanged<LeadFormData> onTemplateSelected;

  const FormTemplatePicker({
    super.key,
    required this.customTemplates,
    required this.onTemplateSelected,
  });

  @override
  Widget build(BuildContext context) {
    if (customTemplates.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        child: Container(
          height: 110,
          width: double.infinity,
          decoration: BoxDecoration(
            color: context.colors.card.withValues(alpha: 0.3),
            borderRadius: AppSpacing.borderRadiusLg,
            border: Border.all(color: context.colors.borderLight, style: BorderStyle.solid),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.style_rounded, color: context.colors.textTertiary, size: 32),
              SizedBox(height: AppSpacing.sm),
              Text(
                'No custom templates saved.',
                style: TextStyle(color: context.colors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return SizedBox(
      height: 110,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        itemCount: customTemplates.length,
        separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.md),
        itemBuilder: (context, index) {
          final template = customTemplates[index];

          return GestureDetector(
            onTap: () {
              Haptics.selection();
              onTemplateSelected(template.data);
            },
            child: ClipRRect(
              borderRadius: AppSpacing.borderRadiusLg,
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  width: 110,
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: context.colors.card.withValues(alpha: 0.6),
                    borderRadius: AppSpacing.borderRadiusLg,
                    border: Border.all(
                      color: context.colors.primaryAccent.withValues(alpha: 0.5),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.sm),
                        decoration: BoxDecoration(
                          color: context.colors.primaryAccent.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(template.icon, size: 24, color: context.colors.primaryAccent),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        template.name,
                        style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w600),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
