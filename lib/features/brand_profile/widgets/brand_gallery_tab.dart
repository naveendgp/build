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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isOwner)
          Padding(
            padding: const EdgeInsets.only(right: 8.0, top: 8.0, bottom: 4.0),
            child: Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                icon: Icon(Icons.info_outline_rounded, color: context.colors.textSecondary),
                tooltip: 'Gallery Info',
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: context.colors.card,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      title: Text('Gallery', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.bold, color: context.colors.textPrimary)),
                      content: Text(
                        'Add photos or videos showcasing your shop, products, or services. These will appear on your public brand profile.',
                        style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text('Got it', style: AppTypography.button.copyWith(color: context.colors.primaryAccent)),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        GridView.builder(
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
        ),
      ],
    );
  }
}
