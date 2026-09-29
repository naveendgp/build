import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/create_post_models.dart';

class ReviewStep extends StatelessWidget {
  final CreatePostState state;

  const ReviewStep({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Review & Publish', style: AppTypography.headlineMedium),
          const SizedBox(height: AppSpacing.xs),
          Text('Almost there! Review your post details.', style: AppTypography.bodyMedium),
          const SizedBox(height: AppSpacing.xl),

          _Section(
            title: 'Media',
            child: SizedBox(
              height: 100,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: state.media.length,
                itemBuilder: (context, index) {
                  return Container(
                    margin: const EdgeInsets.only(right: AppSpacing.sm),
                    width: 100,
                    decoration: BoxDecoration(
                      color: context.colors.surface,
                      borderRadius: AppSpacing.borderRadiusMd,
                      image: DecorationImage(
                        image: FileImage(state.media[index].file),
                        fit: BoxFit.cover,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          _Section(
            title: 'Content',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  state.title.isNotEmpty ? state.title : 'No Title',
                  style: AppTypography.labelLarge,
                ),
                if (state.description.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(state.description, style: AppTypography.bodyMedium),
                ],
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (state.objective != null) ...[
            _Section(
              title: 'Objective',
              child: Text(
                ObjectiveMeta.all.firstWhere((m) => m.objective == state.objective).title,
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
          if (state.cta != null && state.cta!.type != CtaType.noButton) ...[
            _Section(
              title: 'Call to Action',
              child: Text(
                '${state.cta!.displayLabel} → ${state.cta!.destinationUrl ?? ''}',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.primaryAccent),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
          _Section(
            title: 'Schedule',
            child: Text(
              state.publishMode == PublishMode.now
                  ? 'Publish Now'
                  : 'Scheduled: ${state.scheduledAt?.toString() ?? ''}',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;

  const _Section({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary)),
        const SizedBox(height: AppSpacing.sm),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: context.colors.card,
            borderRadius: AppSpacing.borderRadiusLg,
            border: Border.all(color: context.colors.border),
          ),
          child: child,
        ),
      ],
    );
  }
}
