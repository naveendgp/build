import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/create_post_models.dart';

class CtaStep extends StatelessWidget {
  final PostObjective objective;
  final CtaData ctaData;
  final ValueChanged<CtaType> onCtaTypeChanged;
  final ValueChanged<String> onUrlChanged;

  const CtaStep({
    super.key,
    required this.objective,
    required this.ctaData,
    required this.onCtaTypeChanged,
    required this.onUrlChanged,
  });

  @override
  Widget build(BuildContext context) {
    final meta = ObjectiveMeta.all.firstWhere((m) => m.objective == objective);
    final availableCtas = meta.availableCtas;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Call to Action',
            style: AppTypography.headlineMedium,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Choose a button for your campaign',
            style: AppTypography.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.md,
            children: availableCtas.map((ctaType) {
              final isSelected = ctaData.type == ctaType;
              final dummyData = CtaData(type: ctaType); // for getting display label
              return GestureDetector(
                onTap: () {
                  Haptics.selection();
                  onCtaTypeChanged(ctaType);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                  decoration: BoxDecoration(
                    color: isSelected ? meta.accentColor.withValues(alpha: 0.15) : context.colors.card,
                    borderRadius: AppSpacing.borderRadiusMd,
                    border: Border.all(
                      color: isSelected ? meta.accentColor : context.colors.border,
                      width: isSelected ? 2.0 : 1.0,
                    ),
                  ),
                  child: Text(
                    dummyData.displayLabel,
                    style: AppTypography.labelLarge.copyWith(
                      color: isSelected ? context.colors.textPrimary : context.colors.textSecondary,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.xxl),
          if (ctaData.type != CtaType.noButton && objective != PostObjective.leadGeneration && objective != PostObjective.messaging) ...[
            Text(
              'Destination URL',
              style: AppTypography.labelLarge,
            ),
            const SizedBox(height: AppSpacing.sm),
            Container(
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: AppSpacing.borderRadiusLg,
                border: Border.all(color: context.colors.border),
              ),
              child: TextFormField(
                initialValue: ctaData.destinationUrl,
                onChanged: onUrlChanged,
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'https://example.com',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.md),
                  prefixIcon: Icon(Icons.link, color: context.colors.textSecondary),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
