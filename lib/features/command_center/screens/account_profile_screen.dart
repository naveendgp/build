import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../widgets/glass_scaffold.dart';
import '../widgets/setting_input.dart';
import '../widgets/image_upload_card.dart';
import '../../../core/utils/haptics.dart';
import '../../home/widgets/hamburger_menu_sheet.dart' show userProfileProvider;
import '../providers/command_center_provider.dart';

class AccountProfileScreen extends ConsumerStatefulWidget {
  const AccountProfileScreen({super.key});

  @override
  ConsumerState<AccountProfileScreen> createState() => _AccountProfileScreenState();
}

class _AccountProfileScreenState extends ConsumerState<AccountProfileScreen> {
  final Map<String, dynamic> _updates = {};
  bool _isUploadingLogo = false;
  bool _isUploadingBanner = false;

  void _onFieldChanged(String key, String value) {
    setState(() {
      _updates[key] = value;
    });
  }

  Future<void> _saveChanges(bool isBrand) async {
    if (_updates.isEmpty) return;
    Haptics.selection();
    final success = await ref.read(commandCenterProvider.notifier).updateProfile(
      _updates,
      isBrand: isBrand,
    );
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Profile updated successfully', style: TextStyle(color: Colors.white)),
          backgroundColor: const Color(0xFF22C55E),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      setState(() {
        _updates.clear();
      });
    }
  }

  Future<void> _pickAndUploadImage({
    required bool isBrand,
    required bool isBanner,
  }) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 90,
      maxWidth: isBanner ? 1920 : 800,
    );
    if (picked == null) return;

    final file = File(picked.path);
    Haptics.selection();

    setState(() {
      if (isBanner) {
        _isUploadingBanner = true;
      } else {
        _isUploadingLogo = true;
      }
    });

    bool success = false;

    if (!isBrand && !isBanner) {
      // User avatar — use dedicated endpoint
      success = await ref.read(commandCenterProvider.notifier).uploadUserAvatar(file);
    } else {
      // Brand logo or banner — upload then update profile
      final type = isBanner ? 'background' : 'avatar';
      final url = await ref.read(commandCenterProvider.notifier).uploadImage(file, type);
      if (url != null) {
        final fieldKey = isBanner ? 'coverImageUrl' : 'logoUrl';
        success = await ref.read(commandCenterProvider.notifier).updateProfile(
          {fieldKey: url},
          isBrand: true,
        );
      }
    }

    if (mounted) {
      setState(() {
        _isUploadingLogo = false;
        _isUploadingBanner = false;
      });
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isBanner ? 'Banner updated!' : 'Profile photo updated!',
              style: const TextStyle(color: Colors.white),
            ),
            backgroundColor: const Color(0xFF22C55E),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final isSaving = ref.watch(commandCenterProvider);

    return profileAsync.when(
      data: (profile) {
        final isBrand = profile['role'] == 'BRAND';
        final logoUrl = isBrand ? profile['logoUrl'] : profile['profilePic'];
        final bannerUrl = isBrand ? profile['coverImageUrl'] : null;

        return GlassScaffold(
          title: 'Account & Profile',
          floatingActionButton: _updates.isNotEmpty
              ? FloatingActionButton.extended(
                  onPressed: isSaving ? null : () => _saveChanges(isBrand),
                  backgroundColor: const Color(0xFF7C5CFF),
                  icon: isSaving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.check, color: Colors.white),
                  label: Text(
                    isSaving ? 'Saving...' : 'Save Changes',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                )
              : null,
          body: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Image Upload Section ──
                if (isBrand) ...[
                  // Banner / Cover Image
                  ImageUploadCard(
                    imageUrl: bannerUrl,
                    isBanner: true,
                    isLoading: _isUploadingBanner,
                    placeholderIcon: Icons.panorama_outlined,
                    onTap: () => _pickAndUploadImage(isBrand: true, isBanner: true),
                  ),
                  const SizedBox(height: 16),
                  // Logo
                  Center(
                    child: Column(
                      children: [
                        ImageUploadCard(
                          imageUrl: logoUrl,
                          isLoading: _isUploadingLogo,
                          placeholderIcon: Icons.store_rounded,
                          onTap: () => _pickAndUploadImage(isBrand: true, isBanner: false),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap to change logo',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  // User Profile Picture
                  Center(
                    child: Column(
                      children: [
                        ImageUploadCard(
                          imageUrl: logoUrl,
                          isLoading: _isUploadingLogo,
                          placeholderIcon: Icons.person_rounded,
                          onTap: () => _pickAndUploadImage(isBrand: false, isBanner: false),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap to change photo',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 32),

                // ── Public Identity ──
                const Text(
                  'Public Identity',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'Name',
                  hintText: 'Enter your name',
                  initialValue: profile['name'],
                  onChanged: (v) => _onFieldChanged('name', v),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'Bio',
                  hintText: 'Tell the world about yourself',
                  initialValue: profile['bio'],
                  maxLines: 4,
                  onChanged: (v) => _onFieldChanged('bio', v),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'Website',
                  hintText: 'https://...',
                  initialValue: profile['website'],
                  keyboardType: TextInputType.url,
                  onChanged: (v) => _onFieldChanged('website', v),
                ),

                if (isBrand) ...[
                  const SizedBox(height: 16),
                  SettingInput(
                    label: 'Category',
                    hintText: 'e.g., Fashion, Food, Tech',
                    initialValue: profile['category'],
                    onChanged: (v) => _onFieldChanged('category', v),
                  ),
                  const SizedBox(height: 16),
                  SettingInput(
                    label: 'Location',
                    hintText: 'City, Country',
                    initialValue: profile['location'],
                    onChanged: (v) => _onFieldChanged('location', v),
                  ),
                ],
                const SizedBox(height: 32),

                // ── Contact Information ──
                const Text(
                  'Contact Information',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'Email',
                  hintText: 'hello@email.com',
                  initialValue: profile['email'],
                  keyboardType: TextInputType.emailAddress,
                  readOnly: true,
                ),

                if (isBrand) ...[
                  const SizedBox(height: 16),
                  SettingInput(
                    label: 'Phone Number',
                    hintText: '+1 234 567 890',
                    initialValue: profile['contactNumber'],
                    keyboardType: TextInputType.phone,
                    onChanged: (v) => _onFieldChanged('contactNumber', v),
                  ),
                  const SizedBox(height: 16),
                  SettingInput(
                    label: 'WhatsApp',
                    hintText: 'WhatsApp Number',
                    initialValue: profile['whatsapp'],
                    keyboardType: TextInputType.phone,
                    onChanged: (v) => _onFieldChanged('whatsapp', v),
                  ),
                  const SizedBox(height: 32),

                  // ── Social Links ──
                  const Text(
                    'Social Links',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  SettingInput(
                    label: 'Instagram',
                    hintText: '@username',
                    initialValue: profile['instagram'],
                    onChanged: (v) => _onFieldChanged('instagram', v),
                  ),
                  const SizedBox(height: 16),
                  SettingInput(
                    label: 'Facebook',
                    hintText: 'facebook.com/username',
                    initialValue: profile['facebook'],
                    onChanged: (v) => _onFieldChanged('facebook', v),
                  ),
                ],
                const SizedBox(height: 100), // Space for FAB
              ],
            ),
          ),
        );
      },
      loading: () => const GlassScaffold(
        title: 'Account & Profile',
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      ),
      error: (err, stack) => const GlassScaffold(
        title: 'Account & Profile',
        body: Center(child: Text('Failed to load profile', style: TextStyle(color: Colors.white))),
      ),
    );
  }
}
