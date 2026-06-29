import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../models/brand_profile_models.dart';
import '../providers/brand_profile_provider.dart';

class BrandGalleryTab extends ConsumerWidget {
  final List<BrandGalleryItem> gallery;
  final bool isOwner;

  const BrandGalleryTab({
    super.key,
    required this.gallery,
    required this.isOwner,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (gallery.isEmpty && !isOwner) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0).copyWith(bottom: 120),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.photo_library,
                size: 48,
                color: context.colors.textSecondary,
              ),
              const SizedBox(height: 16),
              Text(
                'No gallery photos',
                style: AppTypography.bodyLarge.copyWith(
                  color: context.colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final itemCount = isOwner ? gallery.length + 1 : gallery.length;

    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: EdgeInsets.zero.copyWith(bottom: 120),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
        childAspectRatio: 1.0,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        if (isOwner && index == 0) {
          return InkWell(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Image picker coming soon')),
              );
            },
            child: Container(
              color: context.colors.surfaceSecondary,
              child: Center(
                child: Icon(
                  Icons.add_photo_alternate_rounded,
                  color: context.colors.textTertiary,
                  size: 32,
                ),
              ),
            ),
          );
        }

        final itemIndex = isOwner ? index - 1 : index;
        final item = gallery[itemIndex];

        return Container(
          color: context.colors.surfaceSecondary,
          child: Image.network(
            item.imageUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Center(
              child: Icon(
                Icons.broken_image_rounded,
                color: context.colors.textTertiary,
              ),
            ),
          ),
        );
      },
    );
  }
}
