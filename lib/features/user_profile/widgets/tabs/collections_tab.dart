import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/haptics.dart';
import '../../collection_detail_screen.dart';
import '../../providers/collections_provider.dart';
import '../../models/user_profile_models.dart';

class CollectionsTab extends ConsumerWidget {
  const CollectionsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collectionsAsync = ref.watch(collectionsProvider);

    return collectionsAsync.when(
      loading: () =>
          const SizedBox(height: 300, child: Center(child: CircularProgressIndicator.adaptive())),
      error: (error, _) => SizedBox(
        height: 300,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: context.colors.textTertiary),
              const SizedBox(height: 12),
              Text(
                'Failed to load collections',
                style: AppTypography.bodyMedium.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
      data: (collections) {
        if (collections.isEmpty) {
          return SizedBox(
            height: 300,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.grid_view_rounded, size: 48, color: context.colors.textTertiary),
                  const SizedBox(height: 12),
                  Text(
                    'No collections yet',
                    style: AppTypography.bodyMedium.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Create a collection to organize your saved posts',
                    style: AppTypography.bodySmall.copyWith(color: context.colors.textTertiary),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }

        return GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8).copyWith(bottom: 120),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 16,
            childAspectRatio: 0.75,
          ),
          itemCount: collections.length,
          itemBuilder: (context, index) {
            final item = collections[index];
            return _CollectionCard(item: item);
          },
        );
      },
    );
  }
}

class _CollectionCard extends StatelessWidget {
  final CollectionItem item;

  const _CollectionCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Haptics.light();
        Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => CollectionDetailScreen(collection: item)));
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (item.coverImages.isNotEmpty)
                    Image.network(
                      item.coverImages.first,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: context.colors.surfaceSecondary,
                        child: Icon(
                          Icons.broken_image_rounded,
                          color: context.colors.textTertiary,
                          size: 28,
                        ),
                      ),
                    )
                  else
                    Container(
                      color: context.colors.surfaceSecondary,
                      child: Center(
                        child: Icon(
                          Icons.folder_rounded,
                          color: context.colors.textTertiary,
                          size: 32,
                        ),
                      ),
                    ),
                  if (item.isPrivate)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.lock_rounded, color: Colors.white, size: 14),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            item.title,
            style: AppTypography.bodySmall.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            '${item.postCount} posts',
            style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
          ),
        ],
      ),
    );
  }
}
