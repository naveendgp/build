import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/haptics.dart';
import '../create_collection_modal.dart';
import '../vault/collection_card.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import '../../collection_detail_screen.dart';
import '../../providers/collections_provider.dart';

class CollectionsTab extends ConsumerWidget {
  const CollectionsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collectionsAsync = ref.watch(collectionsProvider);

    return collectionsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Text('Error loading collections', style: AppTypography.bodyMedium),
      ),
      data: (collections) {
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Your Boards', style: AppTypography.titleMedium),
                  IconButton(
                    icon: Icon(Icons.add_rounded, color: context.colors.primaryAccent),
                    onPressed: () {
                      Haptics.light();
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (context) => const CreateCollectionModal(),
                      );
                    },
                  ),
                ],
              ),
            ),
            if (collections.isEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.collections_bookmark_outlined, size: 64, color: context.colors.textTertiary),
                      const SizedBox(height: AppSpacing.md),
                      Text('No boards yet', style: AppTypography.titleMedium),
                      const SizedBox(height: AppSpacing.sm),
                      Text('Create boards to organize your saved posts', 
                        style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            else
              Expanded(
                child: MasonryGridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: AppSpacing.lg,
                  crossAxisSpacing: AppSpacing.sm,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm).copyWith(bottom: 120),
                  itemCount: collections.length,
                  itemBuilder: (context, index) {
                    final item = collections[index];
                    return CollectionCard(
                      item: item,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => CollectionDetailScreen(collection: item),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
          ],
        );
      },
    );
  }
}
