import 'package:flutter/material.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/create_post_models.dart';
import 'objective_card.dart';

class ObjectiveStep extends StatelessWidget {
  final PostObjective? selectedObjective;
  final ValueChanged<PostObjective?> onObjectiveSelected;

  const ObjectiveStep({
    super.key,
    required this.selectedObjective,
    required this.onObjectiveSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Marketing Objective', style: AppTypography.headlineMedium),
          const SizedBox(height: AppSpacing.xs),
          Text('What is the primary goal of this campaign?', style: AppTypography.bodyMedium),
          const SizedBox(height: AppSpacing.xl),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              childAspectRatio: 0.78,
            ),
            itemCount: ObjectiveMeta.all.length,
            itemBuilder: (context, index) {
              final meta = ObjectiveMeta.all[index];
              return ObjectiveCard(
                meta: meta,
                isSelected: selectedObjective == meta.objective,
                onTap: () {
                  Haptics.selection();
                  onObjectiveSelected(meta.objective);
                },
              );
            },
          ),
        ],
      ),
    );
  }
}
