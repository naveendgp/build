import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../brand_profile/providers/brand_profile_provider.dart';
import '../../brand_profile/models/brand_profile_models.dart';
import '../models/settings_models.dart';
import '../providers/settings_provider.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';
import '../../../core/utils/haptics.dart';
import '../../../core/utils/app_messenger.dart';

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
  late TextEditingController _twitterController;
  late TextEditingController _whatsappController;

  final ImagePicker _picker = ImagePicker();
  bool _isUploadingImage = false;
  bool _initialized = false;
  
  List<BrandService> _services = [];
  bool _hasChanges = false;

  void _markChanged() {
    if (mounted && !_hasChanges) {
      setState(() => _hasChanges = true);
    }
  }

  @override
  void initState() {
    super.initState();
    _bioController = TextEditingController()..addListener(_markChanged);
    _descController = TextEditingController()..addListener(_markChanged);
    _websiteController = TextEditingController()..addListener(_markChanged);
    _emailController = TextEditingController()..addListener(_markChanged);
    _phoneController = TextEditingController()..addListener(_markChanged);
    _addressController = TextEditingController()..addListener(_markChanged);
    _gstController = TextEditingController()..addListener(_markChanged);
    _instagramController = TextEditingController()..addListener(_markChanged);
    _facebookController = TextEditingController()..addListener(_markChanged);
    _twitterController = TextEditingController()..addListener(_markChanged);
    _whatsappController = TextEditingController()..addListener(_markChanged);
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
    _twitterController.dispose();
    _whatsappController.dispose();
    super.dispose();
  }

  void _showBrandTagsSheet(BuildContext context, WidgetRef ref, BrandProfile? profile) {
    if (profile == null) {
      AppMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Brand tags aren\'t ready yet. Please try again in a moment.')),
      );
      return;
    }
    List<String> tags = [
      'Eco-Friendly',
      'Handmade',
      'Premium',
      'Vegan',
      'Organic',
      'Local',
      'Sustainable',
      'Minimalist',
      'Luxury',
      'Affordable',
      'Custom',
      'B2B'
    ];

    List<String> selected = List<String>.from(profile.tags);
    final TextEditingController tagController = TextEditingController();

    // Add any existing custom tags to the top of the predefined list
    for (final t in selected.reversed) {
      if (!tags.contains(t)) {
        tags.insert(0, t);
      }
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      // Explicit width bound works around a Flutter bottom-sheet-size-listener
      // regression that otherwise hands descendants (e.g. the ElevatedButton
      // below) an infinite-width constraint when the sheet's content resizes.
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return Container(
            decoration: BoxDecoration(
              color: context.colors.card,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Container(
                    width: 40, height: 4,
                    decoration: BoxDecoration(color: context.colors.border, borderRadius: BorderRadius.circular(100)),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('Brand Tags', style: AppTypography.titleMedium),
                ),
                Flexible(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    shrinkWrap: true,
                    itemCount: tags.length,
                    itemBuilder: (_, i) {
                      final label = tags[i];
                      final isSelected = selected.contains(label);
                      
                      return ListTile(
                        onTap: () { 
                          Haptics.selection(); 
                          setState(() {
                            if (isSelected) {
                              selected.remove(label);
                            } else {
                              selected.add(label);
                            }
                          });
                          ref.read(brandProfileProvider('me').notifier).updateBrandDetails(
                            tags: selected,
                          );
                        },
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        leading: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: isSelected ? context.colors.primaryAccent.withOpacity(0.15) : context.colors.surface,
                            borderRadius: BorderRadius.circular(8)
                          ),
                          child: Icon(Icons.local_offer_rounded, size: 20, color: isSelected ? context.colors.primaryAccent : context.colors.textSecondary)
                        ),
                        title: Text(label, style: AppTypography.labelLarge.copyWith(color: isSelected ? context.colors.primaryAccent : context.colors.textPrimary)),
                        trailing: isSelected ? Icon(Icons.check_circle_rounded, color: context.colors.primaryAccent) : null,
                      );
                    },
                  ),
                ),
                Padding(
                  padding: EdgeInsets.only(
                    left: 20, right: 20, top: 12, bottom: MediaQuery.of(ctx).viewInsets.bottom > 0 ? MediaQuery.of(ctx).viewInsets.bottom + 12 : 12
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: tagController,
                          decoration: InputDecoration(
                            hintText: 'Add custom tag...',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                          ),
                          onSubmitted: (val) {
                            final text = val.trim();
                            if (text.isNotEmpty && !tags.contains(text)) {
                              setState(() {
                                tags.insert(0, text);
                                selected.add(text);
                              });
                              tagController.clear();
                              ref.read(brandProfileProvider('me').notifier).updateBrandDetails(tags: selected);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        // The app's ElevatedButtonTheme defaults minimumSize to
                        // Size(double.infinity, ...) for full-width buttons. That's
                        // fatal here: this button is a non-flex sibling in a Row next
                        // to an Expanded TextField, and Row measures non-flex children
                        // with an unbounded max width — combined with an infinite min
                        // width from the theme, layout gets a forced-infinite-width
                        // constraint and throws. Give it a normal, bounded, text-field-
                        // height size instead of shrinking to zero (which looked broken).
                        style: ElevatedButton.styleFrom(minimumSize: const Size(72, AppSpacing.buttonHeight)),
                        onPressed: () {
                          final text = tagController.text.trim();
                          if (text.isNotEmpty && !tags.contains(text)) {
                            setState(() {
                              tags.insert(0, text);
                              selected.add(text);
                            });
                            tagController.clear();
                            ref.read(brandProfileProvider('me').notifier).updateBrandDetails(tags: selected);
                          }
                        },
                        child: const Text('Add'),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: MediaQuery.of(ctx).padding.bottom + 12),
              ],
            ),
          );
        }
      ),
    );
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
        twitter: _twitterController.text,
        whatsapp: _whatsappController.text,
      );
      
      try {
        await ref.read(brandSettingsProvider.notifier).updateSettings(updated);
        
        final qs = ref.read(brandProfileProvider('me')).quicksite;
        final quicksiteMap = {
          'about': _bioController.text,
          'services': _services.map((s) => s.toJson()).toList(),
          if (qs != null) 'products': qs.products.map((p) => p.toJson()).toList(),
          if (qs != null) 'contact': {
            'email': _emailController.text,
            'phone': _phoneController.text,
            'address': _addressController.text,
            'businessHours': qs.contact.hours,
          },
          if (qs != null) 'instagram': _instagramController.text,
          if (qs != null) 'facebook': _facebookController.text,
          if (qs != null) 'twitter': _twitterController.text,
          if (qs != null) 'whatsapp': _whatsappController.text,
        };

        await ref.read(brandProfileProvider('me').notifier).updateBrandDetails(
          bio: _bioController.text,
          quicksite: quicksiteMap,
        );
        if (mounted) {
          AppMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Settings saved successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          AppMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error saving settings: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsState = ref.watch(brandSettingsProvider);
    final profileState = ref.watch(brandProfileProvider('me'));
    final isLoading = settingsState.isLoading || profileState.loadState == BrandLoadState.loading || profileState.loadState == BrandLoadState.initial;

    if (isLoading) {
      return Scaffold(
        backgroundColor: context.colors.background,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: const Center(child: CircularProgressIndicator.adaptive()),
      );
    }

    if (profileState.loadState == BrandLoadState.error) {
      return Scaffold(
        backgroundColor: context.colors.background,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Failed to load brand profile.',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.read(brandProfileProvider('me').notifier).loadBrand('me'),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final settings = settingsState.value;
    final profile = profileState.profile;

    if (!_initialized && settings != null && profile != null) {
      final qs = profileState.quicksite;
      _bioController.text = profile.bio ?? '';
      _descController.text = settings.businessDescription ?? '';
      _websiteController.text = settings.website ?? '';
      _emailController.text = settings.contactEmail ?? '';
      _phoneController.text = settings.contactPhone ?? '';
      _addressController.text = settings.businessAddress ?? '';
      _gstController.text = settings.gstVatNumber ?? '';
      _instagramController.text = settings.instagram ?? '';
      _facebookController.text = settings.facebook ?? '';
      _twitterController.text = settings.twitter ?? '';
      _whatsappController.text = settings.whatsapp ?? '';
      _services = List.from(qs?.services ?? []);
      
      _initialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _hasChanges = false);
      });
    }

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
            data: (settings) => _hasChanges
                ? TextButton(
                    onPressed: () {
                      _save(settings);
                      setState(() => _hasChanges = false);
                    },
                    child: Text(
                      'Save',
                      style: AppTypography.bodyMedium.copyWith(
                        color: context.colors.primaryAccent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
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
                  SettingsItem(
                    title: 'Brand Tags',
                    icon: Icons.local_offer_outlined,
                    onTap: () => _showBrandTagsSheet(context, ref, ref.read(brandProfileProvider('me')).profile),
                  ),
                ],
              ),
              SettingsGroup(
                title: 'Services & Pricing',
                children: [
                  ..._buildServicesList(context),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: InkWell(
                      onTap: () => _showServiceDialog(context),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: context.colors.primaryAccent.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.colors.primaryAccent.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_circle_outline_rounded, color: context.colors.primaryAccent),
                            const SizedBox(width: 8),
                            Text('Add Service or Product', style: AppTypography.button.copyWith(color: context.colors.primaryAccent)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              SettingsGroup(
                title: 'Social Links',
                children: [
                  _buildTextField(context, 'Instagram Username', _instagramController),
                  _buildTextField(context, 'Facebook Username', _facebookController),
                  _buildTextField(context, 'Twitter Username', _twitterController),
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
                      verificationStatusLabel(settings.verificationStatus),
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
        loading: () => const Center(child: CircularProgressIndicator.adaptive()),
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
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1080);
    if (image == null) return;

    setState(() => _isUploadingImage = true);
    
    try {
      final success = await ref.read(brandProfileProvider('me').notifier).updateProfileImage(File(image.path), isCover: isCover);
      if (mounted) {
        if (success) {
          AppMessenger.of(context).showSnackBar(const SnackBar(content: Text('Image updated successfully!')));
        } else {
          final message = ref.read(brandProfileProvider('me')).lastActionError ?? 'Something went wrong. Please try again.';
          AppMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
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
                child: const Center(child: CircularProgressIndicator.adaptive()),
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildServicesList(BuildContext context) {
    return _services.asMap().entries.map((entry) {
      final index = entry.key;
      final service = entry.value;
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Container(
          decoration: BoxDecoration(
            color: context.colors.surface,
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            title: Text(service.name, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold, color: context.colors.textPrimary)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (service.description.isNotEmpty) Text(service.description, style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary)),
                if (service.price != null && service.price!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(service.price!, style: AppTypography.labelMedium.copyWith(color: context.colors.primaryAccent, fontWeight: FontWeight.bold)),
                  ),
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: Icon(Icons.edit_outlined, color: context.colors.textSecondary),
                  onPressed: () => _showServiceDialog(context, index: index, service: service),
                ),
                IconButton(
                  icon: Icon(Icons.delete_outline, color: context.colors.error),
                  onPressed: () {
                    setState(() {
                      _services.removeAt(index);
                      _hasChanges = true;
                    });
                  },
                ),
              ],
            ),
          ),
        ),
      );
    }).toList();
  }

  void _showServiceDialog(BuildContext context, {int? index, BrandService? service}) {
    final nameCtrl = TextEditingController(text: service?.name ?? '');
    final descCtrl = TextEditingController(text: service?.description ?? '');
    final priceCtrl = TextEditingController(text: service?.price ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: context.colors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  service == null ? 'Add Service or Product' : 'Edit Service or Product',
                  style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.bold, color: context.colors.textPrimary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Showcase what your brand offers to customers',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                _buildTextField(context, 'Name', nameCtrl),
                _buildTextField(context, 'Description', descCtrl, maxLines: 2),
                _buildTextField(context, 'Pricing', priceCtrl),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          side: BorderSide(color: context.colors.border),
                        ),
                        child: Text('Cancel', style: AppTypography.button.copyWith(color: context.colors.textSecondary)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: () {
                          if (nameCtrl.text.trim().isEmpty || priceCtrl.text.trim().isEmpty) {
                            AppMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Name and Pricing are required')));
                            return;
                          }
                          final newService = BrandService(
                            name: nameCtrl.text.trim(),
                            description: descCtrl.text.trim(),
                            price: priceCtrl.text.trim(),
                            icon: Icons.style_rounded,
                          );
                          setState(() {
                            if (index != null) {
                              _services[index] = newService;
                            } else {
                              _services.add(newService);
                            }
                            _hasChanges = true;
                          });
                          Navigator.pop(ctx);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.colors.primaryAccent,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                        ),
                        child: Text('Save', style: AppTypography.button.copyWith(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          ),
        ),
      ),
    );
  }
}
