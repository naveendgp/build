import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../brand_profile/providers/brand_profile_provider.dart';
import '../models/settings_models.dart';
import '../providers/settings_provider.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';

class BrandProfileSettingsScreen extends ConsumerStatefulWidget {
  const BrandProfileSettingsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<BrandProfileSettingsScreen> createState() => _BrandProfileSettingsScreenState();
}

class _BrandProfileSettingsScreenState extends ConsumerState<BrandProfileSettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _bioController;
  late TextEditingController _descController;
  late TextEditingController _websiteController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;
  late TextEditingController _gstController;
  late TextEditingController _instagramController;
  late TextEditingController _facebookController;
  late TextEditingController _whatsappController;

  final ImagePicker _picker = ImagePicker();
  bool _isUploadingImage = false;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _bioController = TextEditingController();
    _descController = TextEditingController();
    _websiteController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _addressController = TextEditingController();
    _gstController = TextEditingController();
    _instagramController = TextEditingController();
    _facebookController = TextEditingController();
    _whatsappController = TextEditingController();
  }

  @override
  void dispose() {
    _bioController.dispose();
    _descController.dispose();
    _websiteController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _gstController.dispose();
    _instagramController.dispose();
    _facebookController.dispose();
    _whatsappController.dispose();
    super.dispose();
  }

  Future<void> _save(BrandSettings currentSettings) async {
    if (_formKey.currentState?.validate() ?? false) {
      final updated = currentSettings.copyWith(
        businessDescription: _descController.text,
        website: _websiteController.text,
        contactEmail: _emailController.text,
        contactPhone: _phoneController.text,
        businessAddress: _addressController.text,
        gstVatNumber: _gstController.text,
        instagram: _instagramController.text,
        facebook: _facebookController.text,
        whatsapp: _whatsappController.text,
      );
      
      try {
        await ref.read(brandSettingsProvider.notifier).updateSettings(updated);
        await ref.read(brandProfileProvider('me').notifier).updateBrandDetails(bio: _bioController.text);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Settings saved successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error saving settings: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsState = ref.watch(brandSettingsProvider);

    settingsState.whenData((settings) {
      if (!_initialized && settings != null) {
        final profile = ref.read(brandProfileProvider('me')).profile;
        _bioController.text = profile?.bio ?? '';
        _descController.text = settings.businessDescription ?? '';
        _websiteController.text = settings.website ?? '';
        _emailController.text = settings.contactEmail ?? '';
        _phoneController.text = settings.contactPhone ?? '';
        _addressController.text = settings.businessAddress ?? '';
        _gstController.text = settings.gstVatNumber ?? '';
        _instagramController.text = settings.instagram ?? '';
        _facebookController.text = settings.facebook ?? '';
        _whatsappController.text = settings.whatsapp ?? '';
        
        // Use a post-frame callback to safely update the UI after the build phase if needed, 
        // though just setting controller text doesn't trigger a rebuild.
        _initialized = true;
      }
    });

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Brand Profile',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          settingsState.when(
            data: (settings) => TextButton(
              onPressed: () => _save(settings),
              child: Text(
                'Save',
                style: AppTypography.bodyMedium.copyWith(
                  color: context.colors.primaryAccent,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: settingsState.when(
        data: (settings) => Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.only(top: 16, bottom: 48),
            children: [
              _buildImageHeader(context, ref),
              const SizedBox(height: 32),
              SettingsGroup(
                title: 'Business Information',
                children: [
                  _buildTextField(context, 'Short Bio', _bioController, maxLines: 2),
                  _buildTextField(context, 'Business Description', _descController, maxLines: 3),
                  _buildTextField(context, 'Website', _websiteController),
                  _buildTextField(context, 'Contact Email', _emailController),
                  _buildTextField(context, 'Contact Phone', _phoneController),
                  _buildTextField(context, 'Business Address', _addressController, maxLines: 2),
                ],
              ),
              SettingsGroup(
                title: 'Social Links',
                children: [
                  _buildTextField(context, 'Instagram Username', _instagramController),
                  _buildTextField(context, 'Facebook Username', _facebookController),
                  _buildTextField(context, 'WhatsApp Number', _whatsappController),
                ],
              ),
              SettingsGroup(
                title: 'Verification',
                children: [
                  _buildTextField(context, 'GST / VAT Number', _gstController),
                  SettingsItem(
                    title: 'Verification Status',
                    icon: Icons.verified_user_outlined,
                    trailing: Text(
                      settings.verificationStatus.name.toUpperCase(),
                      style: AppTypography.bodyMedium.copyWith(
                        color: settings.verificationStatus == VerificationStatus.verified 
                            ? context.colors.primaryAccent 
                            : context.colors.textSecondary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('Error loading settings: $e')),
      ),
    );
  }

  Widget _buildTextField(BuildContext context, String label, TextEditingController controller, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            maxLines: maxLines,
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
            decoration: InputDecoration(
              filled: true,
              fillColor: context.colors.background,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickAndUploadImage(bool isCover) async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;

    setState(() => _isUploadingImage = true);
    
    try {
      final success = await ref.read(brandProfileProvider('me').notifier).updateProfileImage(File(image.path), isCover: isCover);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Image updated successfully!')));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update image.')));
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isUploadingImage = false);
      }
    }
  }

  Widget _buildImageHeader(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(brandProfileProvider('me'));
    final profile = profileState.profile;
    if (profile == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          // Cover Photo
          GestureDetector(
            onTap: _isUploadingImage ? null : () => _pickAndUploadImage(true),
            child: Container(
              height: 140,
              width: double.infinity,
              decoration: BoxDecoration(
                color: context.colors.surface,
                borderRadius: BorderRadius.circular(12),
                image: profile.coverUrl.isNotEmpty
                    ? DecorationImage(image: NetworkImage(profile.coverUrl), fit: BoxFit.cover)
                    : null,
              ),
              child: profile.coverUrl.isEmpty
                  ? Center(child: Icon(Icons.add_photo_alternate_rounded, color: context.colors.textTertiary, size: 32))
                  : Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(child: Icon(Icons.camera_alt, color: Colors.white, size: 32)),
                    ),
            ),
          ),
          // Avatar Photo
          Positioned(
            bottom: -32,
            child: GestureDetector(
              onTap: _isUploadingImage ? null : () => _pickAndUploadImage(false),
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: context.colors.background,
                  shape: BoxShape.circle,
                  border: Border.all(color: context.colors.background, width: 4),
                  image: profile.logoUrl != null
                      ? DecorationImage(image: NetworkImage(profile.logoUrl!), fit: BoxFit.cover)
                      : null,
                ),
                child: profile.logoUrl == null
                    ? Container(
                        decoration: BoxDecoration(
                          color: context.colors.surface,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.person, color: context.colors.textTertiary, size: 32),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.3),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(child: Icon(Icons.camera_alt, color: Colors.white, size: 24)),
                      ),
              ),
            ),
          ),
          if (_isUploadingImage)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.5),
                child: const Center(child: CircularProgressIndicator()),
              ),
            ),
        ],
      ),
    );
  }
}
