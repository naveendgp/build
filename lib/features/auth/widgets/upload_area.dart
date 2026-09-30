import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

class UploadArea extends StatelessWidget {
  final String label;
  final String? imagePath;
  final ValueChanged<String> onImageSelected;
  final VoidCallback? onRemove;
  final bool isCircle;

  const UploadArea({
    super.key,
    required this.label,
    this.imagePath,
    required this.onImageSelected,
    this.onRemove,
    this.isCircle = false,
  });

  Future<void> _pickImage() async {
    Haptics.light();
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1024);
    if (file != null) onImageSelected(file.path);
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = imagePath != null && imagePath!.isNotEmpty;

    return GestureDetector(
      onTap: _pickImage,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: double.infinity,
        height: isCircle ? 120 : 160,
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: isCircle ? null : AppSpacing.borderRadiusLg,
          shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
          border: Border.all(
            color: hasImage
                ? context.colors.primaryAccent.withValues(alpha: 0.3)
                : context.colors.border,
            width: 1.5,
          ),
        ),
        child: hasImage
            ? Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: isCircle ? BorderRadius.circular(100) : AppSpacing.borderRadiusLg,
                    child: Image.file(File(imagePath!), fit: BoxFit.cover),
                  ),
                  if (onRemove != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: onRemove,
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: context.colors.background.withValues(alpha: 0.8),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded, size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                ],
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: context.colors.card,
                      borderRadius: AppSpacing.borderRadiusMd,
                    ),
                    child: Icon(
                      Icons.cloud_upload_outlined,
                      size: 22,
                      color: context.colors.textTertiary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(label, style: AppTypography.labelMedium),
                  const SizedBox(height: 2),
                  Text('Tap to upload', style: AppTypography.labelSmall),
                ],
              ),
      ),
    );
  }
}
