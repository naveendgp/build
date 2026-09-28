import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http_parser/http_parser.dart' as http_parser;
import '../../../core/network/api_client.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../user_profile/providers/user_profile_provider.dart';
import '../../../core/utils/app_messenger.dart';

class ProfileImagePicker extends ConsumerStatefulWidget {
  final String currentAvatarUrl;
  
  const ProfileImagePicker({super.key, required this.currentAvatarUrl});

  @override
  ConsumerState<ProfileImagePicker> createState() => _ProfileImagePickerState();
}

class _ProfileImagePickerState extends ConsumerState<ProfileImagePicker> {
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(source: source, imageQuality: 70, maxWidth: 1080);
      if (pickedFile == null) return;

      await _uploadAvatar(File(pickedFile.path));
    } catch (e) {
      if (mounted) {
        AppMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }

  Future<void> _uploadAvatar(File imageFile) async {
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      String fileName = imageFile.path.split('/').last;
      
      FormData formData = FormData.fromMap({
        "avatar": await MultipartFile.fromFile(
          imageFile.path, 
          filename: fileName,
          contentType: http_parser.MediaType('image', 'jpeg'),
        ),
      });

      final response = await apiClient.dio.post(
        '/user/me/avatar',
        data: formData,
        onSendProgress: (int sent, int total) {
          setState(() {
            _uploadProgress = sent / total;
          });
        },
      );

      if (response.statusCode == 200) {
        if (mounted) {
          AppMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Profile photo updated successfully'),
              backgroundColor: context.colors.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
        ref.read(userProfileProvider.notifier).loadProfile();
      }
    } catch (e) {
      if (mounted) {
        AppMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Upload failed. Please try again.'),
            backgroundColor: context.colors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  Future<void> _removePhoto() async {
    try {
      setState(() => _isUploading = true);
      await ref.read(apiClientProvider).dio.put('/user/me', data: {'profilePic': null});
      ref.read(userProfileProvider.notifier).loadProfile();
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _showImagePickerOptions() {
    // iOS → native action sheet (blurred, capsule cancel). Android keeps the
    // branded bottom sheet below.
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      showAdaptiveActionSheet(
        context,
        title: 'Change Profile Photo',
        actions: [
          AdaptiveSheetAction(
            label: 'Take Photo',
            onPressed: () => _pickImage(ImageSource.camera),
          ),
          AdaptiveSheetAction(
            label: 'Choose from Gallery',
            onPressed: () => _pickImage(ImageSource.gallery),
          ),
          if (widget.currentAvatarUrl.isNotEmpty)
            AdaptiveSheetAction(
              label: 'Remove Photo',
              isDestructive: true,
              onPressed: _removePhoto,
            ),
        ],
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: context.colors.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Change Profile Photo',
                style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold, color: context.colors.textPrimary),
              ),
              const SizedBox(height: 24),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: context.colors.primaryAccent.withOpacity(0.1), shape: BoxShape.circle),
                  child: Icon(Icons.camera_alt_rounded, color: context.colors.primaryAccent),
                ),
                title: Text('Take Photo', style: AppTypography.bodyLarge.copyWith(color: context.colors.textPrimary)),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: context.colors.secondaryAccent.withOpacity(0.1), shape: BoxShape.circle),
                  child: Icon(Icons.photo_library_rounded, color: context.colors.secondaryAccent),
                ),
                title: Text('Choose from Gallery', style: AppTypography.bodyLarge.copyWith(color: context.colors.textPrimary)),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
              if (widget.currentAvatarUrl.isNotEmpty)
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: context.colors.error.withOpacity(0.1), shape: BoxShape.circle),
                    child: Icon(Icons.delete_outline_rounded, color: context.colors.error),
                  ),
                  title: Text('Remove Photo', style: AppTypography.bodyLarge.copyWith(color: context.colors.error)),
                  onTap: () {
                    Navigator.pop(context);
                    _removePhoto();
                  },
                ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: _isUploading ? null : _showImagePickerOptions,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      context.colors.textSecondary.withOpacity(0.5), 
                      context.colors.borderLight
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                padding: const EdgeInsets.all(3),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: context.colors.surfaceSecondary,
                  ),
                  child: ClipOval(
                    child: widget.currentAvatarUrl.isNotEmpty
                        ? Image.network(widget.currentAvatarUrl, fit: BoxFit.cover)
                        : Icon(Icons.person_rounded, size: 50, color: context.colors.textTertiary),
                  ),
                ),
              ),
              if (_isUploading)
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.black.withOpacity(0.5),
                  ),
                  child: Center(
                    child: CircularProgressIndicator.adaptive(
                      value: _uploadProgress,
                      valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent)),
                  ),
                ),
              if (!_isUploading)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: context.colors.primaryAccent,
                      shape: BoxShape.circle,
                      border: Border.all(color: context.colors.background, width: 3),
                    ),
                    child: const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.white),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: _isUploading ? null : _showImagePickerOptions,
          child: Text(
            'Change Photo',
            style: AppTypography.labelLarge.copyWith(
              color: context.colors.primaryAccent,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
