import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
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
    this.isOwner = false,
  });

  @override
  ConsumerState<BrandGalleryTab> createState() => _BrandGalleryTabState();
}

class _BrandGalleryTabState extends ConsumerState<BrandGalleryTab> {
  bool _isUploading = false;

  Future<void> _pickAndUploadImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile == null) return;

    setState(() {
      _isUploading = true;
    });

    final success = await ref.read(brandProfileProvider('me').notifier).uploadGalleryImage(File(pickedFile.path));

    setState(() {
      _isUploading = false;
    });

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to upload image', style: TextStyle(color: Colors.white)),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.gallery.isEmpty && !widget.isOwner) {
      return Center(
        child: Text(
          'No gallery items',
          style: AppTypography.bodyLarge.copyWith(color: context.colors.textSecondary),
        ),
      );
    }

    final itemCount = widget.isOwner ? widget.gallery.length + 1 : widget.gallery.length;

    return MasonryGridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      crossAxisCount: 3,
      mainAxisSpacing: 2,
      crossAxisSpacing: 2,
      itemCount: itemCount,
      itemBuilder: (context, index) {
        if (widget.isOwner && index == 0) {
          return AspectRatio(
            aspectRatio: 1.0,
            child: GestureDetector(
              onTap: _isUploading ? null : _pickAndUploadImage,
              child: Container(
                color: context.colors.card,
                child: _isUploading
                    ? Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: context.colors.primaryAccent, strokeWidth: 2)))
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined, color: context.colors.textSecondary, size: 32),
                          const SizedBox(height: 8),
                          Text(
                            'Add Photo',
                            style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary),
                          ),
                        ],
                      ),
              ),
            ),
          );
        }

        final actualIndex = widget.isOwner ? index - 1 : index;
        final item = widget.gallery[actualIndex];
        return AspectRatio(
          aspectRatio: item.aspectRatio,
          child: item.imageUrl.isNotEmpty
              ? Image.network(
                  item.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: context.colors.card,
                    child: Icon(Icons.broken_image, color: context.colors.textTertiary),
                  ),
                )
              : Container(
                  color: context.colors.card,
                  child: Icon(Icons.broken_image, color: context.colors.textTertiary),
                ),
        );
      },
    );
  }
}
