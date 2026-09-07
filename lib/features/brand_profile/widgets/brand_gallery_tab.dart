import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../models/brand_profile_models.dart';
import '../providers/brand_profile_provider.dart';

class BrandGalleryTab extends ConsumerStatefulWidget {
  final List<BrandGalleryItem> gallery;
  final bool isOwner;

  const BrandGalleryTab({
    super.key,
    required this.gallery,
    required this.isOwner,
  });

  @override
  ConsumerState<BrandGalleryTab> createState() => _BrandGalleryTabState();
}

class _BrandGalleryTabState extends ConsumerState<BrandGalleryTab> {
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;

  Future<void> _pickAndUploadImage() async {
    if (_isUploading) return;
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
      maxWidth: 1080,
    );
    if (image == null) return;

    setState(() => _isUploading = true);
    try {
      final success = await ref.read(brandProfileProvider('me').notifier).uploadGalleryImage(File(image.path));
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Added to gallery!')),
          );
        } else {
          final message = ref.read(brandProfileProvider('me')).lastActionError ?? 'Something went wrong. Please try again.';
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
        }
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final gallery = widget.gallery;
    final isOwner = widget.isOwner;
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
                onTap: _isUploading ? null : _pickAndUploadImage,
                child: Container(
                  color: context.colors.surfaceSecondary,
                  child: Center(
                    child: _isUploading
                        ? SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2, color: context.colors.primaryAccent),
                          )
                        : Icon(
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
