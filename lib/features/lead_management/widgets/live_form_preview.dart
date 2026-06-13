import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../models/form_models.dart';

class LiveFormPreview extends StatelessWidget {
  final FormTemplate template;

  const LiveFormPreview({super.key, required this.template});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 320,
      height: 640,
      decoration: BoxDecoration(
        color: context.colors.background,
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: context.colors.borderLight, width: 8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Scaffold(
        backgroundColor: context.colors.background,
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                template.title.isEmpty ? 'Form Title' : template.title,
                style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                template.intro ?? 'Enter a description here...',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.xl),
              ...template.fields.map((field) => _buildPreviewField(context, field)),
              const SizedBox(height: AppSpacing.xxl),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: context.colors.primaryAccent,
                  borderRadius: AppSpacing.borderRadiusMd,
                ),
                alignment: Alignment.center,
                child: Text(
                  'Submit',
                  style: AppTypography.button.copyWith(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreviewField(BuildContext context, FormFieldDefinition field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${field.label}${field.isRequired ? ' *' : ''}',
            style: AppTypography.labelMedium.copyWith(color: context.colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 12),
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: AppSpacing.borderRadiusMd,
              border: Border.all(color: context.colors.borderLight),
            ),
            child: Row(
              children: [
                Text(
                  'Enter your answer',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textTertiary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
