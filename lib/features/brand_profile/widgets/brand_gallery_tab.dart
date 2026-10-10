import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
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
  ///
  /// This was a bare AlertDialog: a red-outlined box, a counter adrift beneath
  /// it and two text buttons in the corner, with nothing to show which photo
  /// was being described. It is a sheet now, with the photo in it.
  Future<String?> _askForDescription({
    String initial = '',
    required String title,
    String? subtitle,
    File? preview,
    String? previewUrl,
  }) {
    final controller = TextEditingController(text: initial);

    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.lg,
          right: AppSpacing.lg,
          top: AppSpacing.sm,
          bottom: MediaQuery.of(sheetContext).viewInsets.bottom + AppSpacing.lg,
        ),
        child: StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            final length = controller.text.characters.length;

            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: context.colors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Row(
                  children: [
                    if (preview != null || previewUrl != null) ...[
                      ClipRRect(
                        borderRadius: AppSpacing.borderRadiusMd,
                        child: SizedBox(
                          width: 56,
                          height: 56,
                          child: preview != null
                              ? Image.file(preview, fit: BoxFit.cover)
                              : Image.network(previewUrl!, fit: BoxFit.cover),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                    ],
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: AppTypography.titleMedium.copyWith(
                              color: context.colors.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            subtitle ?? 'Say what this photo shows. People read it on your profile.',
                            style: AppTypography.labelSmall.copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                TextField(
                  controller: controller,
                  autofocus: true,
                  maxLines: 4,
                  minLines: 2,
                  maxLength: 280,
                  textCapitalization: TextCapitalization.sentences,
                  onChanged: (_) => setSheetState(() {}),
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'A new arrival, the shop front, the team at work…',
                    hintStyle: AppTypography.bodyMedium.copyWith(
                      color: context.colors.textTertiary,
                    ),
                    // The built-in counter sits outside the field; this one is
                    // in the corner of it.
                    counterText: '',
                    filled: true,
                    fillColor: context.colors.background,
                    contentPadding: const EdgeInsets.all(AppSpacing.md),
                    border: OutlineInputBorder(
                      borderRadius: AppSpacing.borderRadiusMd,
                      borderSide: BorderSide(color: context.colors.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: AppSpacing.borderRadiusMd,
                      borderSide: BorderSide(color: context.colors.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: AppSpacing.borderRadiusMd,
                      borderSide: BorderSide(color: context.colors.primaryAccent, width: 1.5),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    '$length/280',
                    style: AppTypography.labelSmall.copyWith(
                      color: length > 260
                          ? context.colors.primaryAccent
                          : context.colors.textTertiary,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(sheetContext),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 48),
                          side: BorderSide(color: context.colors.border),
                          shape: RoundedRectangleBorder(
                            borderRadius: AppSpacing.borderRadiusMd,
                          ),
                        ),
                        child: Text(
                          'Cancel',
                          style: AppTypography.button.copyWith(
                            color: context.colors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      flex: 2,
                      child: FilledButton(
                        onPressed: () => Navigator.pop(sheetContext, controller.text.trim()),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(0, 48),
                          backgroundColor: context.colors.primaryAccent,
                          shape: RoundedRectangleBorder(
                            borderRadius: AppSpacing.borderRadiusMd,
                          ),
                        ),
                        child: Text(
                          'Save',
                          style: AppTypography.button.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _editDescription(BrandGalleryItem item) async {
    final description = await _askForDescription(
      initial: item.description,
      title: 'Photo description',
      subtitle: 'Shown under this photo on your profile.',
      previewUrl: item.imageUrl,
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
    final description = await _askForDescription(
      title: 'Add a description',
      preview: File(image.path),
    );
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
