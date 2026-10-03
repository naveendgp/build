import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../models/brand_profile_models.dart';
import '../providers/brand_profile_provider.dart';
import '../../../core/utils/app_messenger.dart';

class BrandGalleryTab extends ConsumerStatefulWidget {
  final List<BrandGalleryItem> gallery;
  final bool isOwner;

  const BrandGalleryTab({super.key, required this.gallery, required this.isOwner});

  @override
  ConsumerState<BrandGalleryTab> createState() => _BrandGalleryTabState();
}

class _BrandGalleryTabState extends ConsumerState<BrandGalleryTab> {
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;

  /// Asks for the photo's caption. Returns null if the brand backs out, so an
  /// upload can be abandoned at this point without adding anything.
  Future<String?> _askForDescription({String initial = '', required String title}) {
    final controller = TextEditingController(text: initial);
    return showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: context.colors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          title,
          style: AppTypography.titleMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 3,
          minLines: 1,
          maxLength: 280,
          textCapitalization: TextCapitalization.sentences,
          style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
          decoration: InputDecoration(
            hintText: 'Say what this photo shows',
            hintStyle: AppTypography.bodyMedium.copyWith(color: context.colors.textTertiary),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: AppTypography.button.copyWith(color: context.colors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, controller.text.trim()),
            child: Text(
              'Save',
              style: AppTypography.button.copyWith(color: context.colors.primaryAccent),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _editDescription(BrandGalleryItem item) async {
    final description = await _askForDescription(
      initial: item.description,
      title: 'Photo description',
    );
    if (description == null || !mounted) return;
    final saved = await ref
        .read(brandProfileProvider('me').notifier)
        .updateGalleryDescription(item.id, description);
    if (mounted && saved) {
      AppMessenger.of(context).showSnackBar(const SnackBar(content: Text('Description saved')));
    }
  }

  /// Opens one photo with its caption underneath.
  void _openViewer(BrandGalleryItem item) {
    showDialog(
      context: context,
      builder: (dialogContext) => Dialog(
        backgroundColor: context.colors.card,
        insetPadding: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              child: Image.network(item.imageUrl, fit: BoxFit.contain),
            ),
            if (item.description.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
                child: Text(
                  item.description,
                  style: AppTypography.bodyMedium.copyWith(
                    color: context.colors.textPrimary,
                    height: 1.5,
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 4, 8, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (widget.isOwner)
                    TextButton(
                      onPressed: () {
                        Navigator.pop(dialogContext);
                        _editDescription(item);
                      },
                      child: Text(
                        item.description.isEmpty ? 'Add description' : 'Edit description',
                        style: AppTypography.button.copyWith(color: context.colors.primaryAccent),
                      ),
                    ),
                  TextButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    child: Text(
                      'Close',
                      style: AppTypography.button.copyWith(color: context.colors.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickAndUploadImage() async {
    if (_isUploading) return;
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
      maxWidth: 1080,
    );
    if (image == null || !mounted) return;

    // The caption is asked for first, so a photo never lands in the grid
    // without one.
    final description = await _askForDescription(title: 'Add a description');
    if (description == null || !mounted) return;

    setState(() => _isUploading = true);
    try {
      final success = await ref
          .read(brandProfileProvider('me').notifier)
          .uploadGalleryImage(File(image.path), description: description);
      if (mounted) {
        if (success) {
          AppMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to gallery!')));
        } else {
          final message =
              ref.read(brandProfileProvider('me')).lastActionError ??
              'Something went wrong. Please try again.';
          AppMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
        }
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  /// What the gallery is for. Opened from the ⓘ on the add tile.
  void _showGalleryInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.colors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Gallery',
          style: AppTypography.titleLarge.copyWith(
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
        content: Text(
          'Add photos or videos showcasing your shop, products, or services. '
          'These will appear on your public brand profile.',
          style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              'Got it',
              style: AppTypography.button.copyWith(color: context.colors.primaryAccent),
            ),
          ),
        ],
      ),
    );
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
              Icon(Icons.photo_library, size: 48, color: context.colors.textSecondary),
              const SizedBox(height: 16),
              Text(
                'No gallery photos',
                style: AppTypography.bodyLarge.copyWith(color: context.colors.textSecondary),
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
              // The info button used to sit in a row of its own above the
              // grid, which pushed every picture down behind a band of empty
              // space. It rides in the corner of the add tile now.
              return Stack(
                children: [
                  Positioned.fill(
                    child: InkWell(
                      onTap: _isUploading ? null : _pickAndUploadImage,
                      child: Container(
                        color: context.colors.surfaceSecondary,
                        child: Center(
                          child: _isUploading
                              ? SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator.adaptive(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      context.colors.primaryAccent,
                                    ),
                                  ),
                                )
                              : Icon(
                                  Icons.add_photo_alternate_rounded,
                                  color: context.colors.textTertiary,
                                  size: 32,
                                ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 2,
                    right: 2,
                    child: InkWell(
                      onTap: () => _showGalleryInfo(context),
                      customBorder: const CircleBorder(),
                      child: Padding(
                        padding: const EdgeInsets.all(6),
                        child: Icon(
                          Icons.info_outline_rounded,
                          size: 16,
                          color: context.colors.textTertiary,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }

            final itemIndex = isOwner ? index - 1 : index;
            final item = gallery[itemIndex];

            return GestureDetector(
              onTap: () => _openViewer(item),
              child: Container(
                color: context.colors.surfaceSecondary,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(
                      item.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Center(
                        child: Icon(Icons.broken_image_rounded, color: context.colors.textTertiary),
                      ),
                    ),
                    // The caption belongs to the picture, so it is read on the
                    // tile rather than only inside the viewer.
                    if (item.description.isNotEmpty)
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 0,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Colors.transparent, Color(0xB3000000)],
                            ),
                          ),
                          child: Text(
                            item.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.labelSmall.copyWith(
                              color: Colors.white,
                              fontSize: 10,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
