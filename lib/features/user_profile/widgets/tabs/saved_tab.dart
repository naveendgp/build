import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../providers/user_profile_provider.dart';
import '../vault/save_item_card.dart';

class SavedTab extends ConsumerWidget {
  const SavedTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(userProfileProvider);
    final savedPosts = state.savedPosts;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (savedPosts.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 80),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.bookmark_border_rounded, size: 64, color: context.colors.textTertiary),
                    const SizedBox(height: AppSpacing.md),
                    Text('No saved posts yet', style: AppTypography.titleMedium),
                    const SizedBox(height: AppSpacing.sm),
                    Text('Save posts to build your inspiration board', 
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            )
          else ...[
            MasonryGridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: AppSpacing.sm,
              crossAxisSpacing: AppSpacing.sm,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm).copyWith(bottom: 120),
              physics: const NeverScrollableScrollPhysics(),
              shrinkWrap: true,
              itemCount: savedPosts.length,
              itemBuilder: (context, index) {
                final item = savedPosts[index];
                return SaveItemCard(item: item);
              },
            ),
          ],
        ],
      ),
    );
  }
}
