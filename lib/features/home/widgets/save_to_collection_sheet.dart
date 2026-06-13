import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../user_profile/providers/collections_provider.dart';
import '../../user_profile/widgets/create_collection_modal.dart';
import '../../../../core/utils/haptics.dart';

import '../../home/models/feed_models.dart';

class SaveToCollectionSheet extends ConsumerWidget {
  final FeedPost post;

  const SaveToCollectionSheet({
    super.key,
    required this.post,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collectionsAsync = ref.watch(collectionsProvider);

    return Container(
      decoration: BoxDecoration(
        color: context.colors.background,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: context.colors.borderLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Save to Collection',
                  style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold, color: context.colors.textPrimary),
                ),
                TextButton.icon(
                  onPressed: () {
                    Haptics.light();
                    Navigator.pop(context);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (context) => const CreateCollectionModal(),
                    );
                  },
                  icon: const Icon(Icons.add_rounded, size: 20),
                  label: const Text('New'),
                  style: TextButton.styleFrom(
                    foregroundColor: context.colors.primaryAccent,
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: AppSpacing.md),
          Divider(color: context.colors.borderLight, height: 1),
          
          collectionsAsync.when(
            data: (collections) {
              if (collections.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Center(
                    child: Text(
                      'No collections yet',
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                    ),
                  ),
                );
              }
              
              return Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: collections.length,
                  itemBuilder: (context, index) {
                    final collection = collections[index];
                    final isSavedInCollection = collection.posts.any((p) => p.id == post.id);
                    
                    return InkWell(
                      onTap: () async {
                        Haptics.selection();
                        final notifier = ref.read(collectionsProvider.notifier);
                        
                        // We do not wait for togglePostInCollection to finish before popping 
                        // to keep the UI snappy, but we catch errors and show a snackbar.
                        notifier.togglePostInCollection(
                          collection.id,
                          post,
                          isCurrentlyInCollection: isSavedInCollection,
                        ).catchError((e) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Error: Could not save post to collection.'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        });

                        if (!isSavedInCollection) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Saved to ${collection.title}'),
                              behavior: SnackBarBehavior.floating,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        }
                        Navigator.pop(context);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.lg,
                          vertical: AppSpacing.md,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: context.colors.card,
                                borderRadius: BorderRadius.circular(8),
                                image: collection.coverImages.isNotEmpty
                                    ? DecorationImage(
                                        image: NetworkImage(collection.coverImages.first),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: collection.coverImages.isEmpty
                                  ? Icon(Icons.folder_outlined, color: context.colors.textTertiary)
                                  : null,
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    collection.title,
                                    style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: context.colors.textPrimary),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${collection.postCount} posts',
                                    style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            if (isSavedInCollection)
                              Icon(
                                Icons.check_circle_rounded,
                                color: context.colors.primaryAccent,
                                size: 24,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              );
            },
            loading: () => Padding(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: Center(child: CircularProgressIndicator(color: context.colors.primaryAccent)),
            ),
            error: (e, st) => Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Center(child: Text('Error loading collections', style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary))),
            ),
          ),
        ],
      ),
    );
  }
}
