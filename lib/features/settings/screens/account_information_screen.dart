import 'dart:ui';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/network/api_client.dart';
import '../../user_profile/providers/user_profile_provider.dart';
import '../widgets/profile_image_picker.dart';
import '../../../core/utils/app_messenger.dart';

class AccountInformationScreen extends ConsumerStatefulWidget {
  const AccountInformationScreen({super.key});

  @override
  ConsumerState<AccountInformationScreen> createState() => _AccountInformationScreenState();
}

class _AccountInformationScreenState extends ConsumerState<AccountInformationScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isModified = false;

  late TextEditingController _usernameController;
  late TextEditingController _locationController;

  late AnimationController _animController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _fadeAnimation = CurvedAnimation(parent: _animController, curve: Curves.easeOut);

    final profile = ref.read(userProfileProvider).profile;

    _usernameController = TextEditingController(text: profile?.username ?? '');
    _locationController = TextEditingController(text: profile?.location ?? '');

    _usernameController.addListener(_checkModifications);
    _locationController.addListener(_checkModifications);

    _animController.forward();
  }

  void _checkModifications() {
    final profile = ref.read(userProfileProvider).profile;
    final bool modified =
        (_usernameController.text.trim() != (profile?.username ?? '')) ||
        (_locationController.text.trim() != (profile?.location ?? ''));
    if (_isModified != modified) {
      setState(() {
        _isModified = modified;
      });
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    _usernameController.removeListener(_checkModifications);
    _locationController.removeListener(_checkModifications);
    _usernameController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate() || !_isModified) return;

    setState(() => _isLoading = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      final updateData = {
        'username': _usernameController.text.trim(),
        'location': _locationController.text.trim(),
      };

      await apiClient.dio.put('/user/me', data: updateData);

      if (mounted) {
        AppMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Text(
                  'Profile Updated Successfully',
                  style: AppTypography.labelLarge.copyWith(color: Colors.white),
                ),
              ],
            ),
            backgroundColor: context.colors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            margin: const EdgeInsets.all(16),
          ),
        );
        ref.read(userProfileProvider.notifier).loadProfile();
        setState(() => _isModified = false);
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data['message'] ?? 'Failed to update account';
        AppMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: context.colors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openMissingFieldSheet(String fieldName, String dbKey, TextInputType keyboardType) {
    final controller = TextEditingController();
    bool sheetLoading = false;
    String? selectedGender;
    final genderOptions = ['Male', 'Female', 'Other', 'Prefer Not To Say'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
              child: Container(
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                ),
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Add $fieldName',
                      style: AppTypography.titleMedium.copyWith(
                        fontWeight: FontWeight.bold,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),

                    if (dbKey == 'gender')
                      DropdownButtonFormField<String>(
                        value: selectedGender,
                        items: genderOptions
                            .map(
                              (g) => DropdownMenuItem(
                                value: g,
                                child: Text(
                                  g,
                                  style: AppTypography.bodyLarge.copyWith(
                                    color: context.colors.textPrimary,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (val) {
                          setSheetState(() => selectedGender = val);
                        },
                        dropdownColor: context.colors.surfaceSecondary,
                        decoration: InputDecoration(
                          hintText: 'Select your gender',
                          filled: true,
                          fillColor: context.colors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      )
                    else
                      TextFormField(
                        controller: controller,
                        keyboardType: keyboardType,
                        autofocus: true,
                        style: AppTypography.bodyLarge.copyWith(color: context.colors.textPrimary),
                        decoration: InputDecoration(
                          hintText: 'Enter your $fieldName',
                          filled: true,
                          fillColor: context.colors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),

                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: sheetLoading
                          ? null
                          : () async {
                              final valueToSave = dbKey == 'gender'
                                  ? selectedGender
                                  : controller.text.trim();
                              if (valueToSave == null || valueToSave.isEmpty) return;

                              setSheetState(() => sheetLoading = true);
                              try {
                                await ref
                                    .read(apiClientProvider)
                                    .dio
                                    .put('/user/me', data: {dbKey: valueToSave});
                                if (mounted) {
                                  ref.read(userProfileProvider.notifier).loadProfile();
                                  Navigator.pop(ctx);
                                }
                              } catch (e) {
                                AppMessenger.of(
                                  context,
                                ).showSnackBar(SnackBar(content: Text('Error adding $fieldName')));
                              } finally {
                                if (mounted) setSheetState(() => sheetLoading = false);
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.colors.primaryAccent,
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: sheetLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator.adaptive(
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              'Save $fieldName',
                              style: AppTypography.labelLarge.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showContactSupport() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Contact Support',
          style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
        ),
        content: Text(
          'Please reach out to support@lyket.app to verify your identity and add this protected information.',
          style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Close',
              style: AppTypography.labelMedium.copyWith(color: context.colors.primaryAccent),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileCompleteness(double percent, List<String> missing) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Profile Completion',
                style: AppTypography.labelLarge.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${(percent * 100).toInt()}%',
                style: AppTypography.labelLarge.copyWith(
                  color: context.colors.primaryAccent,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: percent,
              minHeight: 8,
              backgroundColor: context.colors.background,
              valueColor: AlwaysStoppedAnimation<Color>(
                percent == 1.0 ? context.colors.success : context.colors.primaryAccent,
              ),
            ),
          ),
          if (missing.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.colors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.colors.warning.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_rounded, color: context.colors.warning, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Complete your profile. Missing information may affect personalization.',
                      style: AppTypography.bodySmall.copyWith(
                        color: context.colors.textPrimary,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildField({
    required String label,
    required String value,
    required bool isEditable,
    bool isMissing = false,
    String? hintText,
    TextEditingController? controller,
    Widget? customAction,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: AppTypography.labelMedium.copyWith(
                color: context.colors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: isEditable
                ? TextFormField(
                    controller: controller,
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                      fillColor: context.colors.background.withOpacity(0.5),
                      filled: true,
                      hintText: hintText,
                      hintStyle: AppTypography.bodyMedium.copyWith(
                        color: context.colors.textTertiary,
                      ),
                    ),
                  )
                : Text(
                    isMissing ? 'Not Added' : value,
                    style: AppTypography.bodyMedium.copyWith(
                      color: isMissing ? context.colors.textTertiary : context.colors.textPrimary,
                      fontStyle: isMissing ? FontStyle.italic : FontStyle.normal,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
          ),
          if (customAction != null)
            customAction
          else if (!isEditable && !isMissing)
            Icon(Icons.lock_rounded, size: 14, color: context.colors.textTertiary),
        ],
      ),
    );
  }

  Widget _buildSection({required String title, required List<Widget> children}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              title.toUpperCase(),
              style: AppTypography.labelSmall.copyWith(
                color: context.colors.textTertiary,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                for (int i = 0; i < children.length; i++) ...[
                  children[i],
                  if (i < children.length - 1)
                    Divider(
                      color: context.colors.borderLight.withOpacity(0.15),
                      height: 1,
                      indent: 16,
                      endIndent: 16,
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(userProfileProvider);
    final profile = profileState.profile;

    if (profile == null)
      return const Scaffold(body: Center(child: CircularProgressIndicator.adaptive()));

    final completion = profile.completionPercentage;
    final missing = profile.missingFields;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        title: Text(
          'Account Information',
          style: AppTypography.titleMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
        centerTitle: true,
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    children: [
                      const SizedBox(height: 24),
                      ProfileImagePicker(currentAvatarUrl: profile.avatarUrl),
                      const SizedBox(height: 8),
                      Text(
                        'Manage your personal account information.',
                        style: AppTypography.bodyMedium.copyWith(
                          color: context.colors.textSecondary,
                        ),
                      ),
                      _buildProfileCompleteness(completion, missing),
                    ],
                  ),
                ),
              ),

              SliverToBoxAdapter(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSection(
                          title: 'Public Profile',
                          children: [
                            _buildField(
                              label: 'Full Name',
                              value: profile.name,
                              isEditable: false,
                              isMissing: profile.name.isEmpty,
                              customAction: profile.name.isEmpty
                                  ? TextButton(
                                      onPressed: () => _openMissingFieldSheet(
                                        'Full Name',
                                        'name',
                                        TextInputType.name,
                                      ),
                                      child: Text(
                                        'Add',
                                        style: AppTypography.labelMedium.copyWith(
                                          color: context.colors.primaryAccent,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                            _buildField(
                              label: 'Username',
                              value: profile.username,
                              isEditable: true,
                              controller: _usernameController,
                              hintText: 'Enter username',
                            ),
                            _buildField(
                              label: 'Location',
                              value: profile.location,
                              isEditable: true,
                              controller: _locationController,
                              hintText: 'Add location',
                            ),
                          ],
                        ),

                        _buildSection(
                          title: 'Private Information',
                          children: [
                            _buildField(
                              label: 'Email',
                              value: profile.email,
                              isEditable: false,
                              isMissing: profile.email.isEmpty,
                              customAction: profile.email.isNotEmpty
                                  ? null
                                  : TextButton(
                                      onPressed: _showContactSupport,
                                      child: Text(
                                        'Contact',
                                        style: AppTypography.labelMedium.copyWith(
                                          color: context.colors.primaryAccent,
                                        ),
                                      ),
                                    ),
                            ),
                            _buildField(
                              label: 'Phone',
                              value: profile.contactNumber,
                              isEditable: false,
                              isMissing: profile.contactNumber.isEmpty,
                              customAction: profile.contactNumber.isEmpty
                                  ? TextButton(
                                      onPressed: () => _openMissingFieldSheet(
                                        'Phone Number',
                                        'contactNumber',
                                        TextInputType.phone,
                                      ),
                                      child: Text(
                                        'Add',
                                        style: AppTypography.labelMedium.copyWith(
                                          color: context.colors.primaryAccent,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                            _buildField(
                              label: 'Gender',
                              value: profile.gender,
                              isEditable: false,
                              isMissing: profile.gender.isEmpty,
                              customAction: profile.gender.isEmpty
                                  ? TextButton(
                                      onPressed: () => _openMissingFieldSheet(
                                        'Gender',
                                        'gender',
                                        TextInputType.text,
                                      ),
                                      child: Text(
                                        'Add',
                                        style: AppTypography.labelMedium.copyWith(
                                          color: context.colors.primaryAccent,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                            _buildField(
                              label: 'Date of Birth',
                              value: profile.dateOfBirth,
                              isEditable: false,
                              isMissing: profile.dateOfBirth.isEmpty,
                              customAction: profile.dateOfBirth.isEmpty
                                  ? TextButton(
                                      onPressed: () async {
                                        final picked = await showAdaptiveDatePicker(
                                          context,
                                          initialDate: DateTime(2000),
                                          firstDate: DateTime(1900),
                                          lastDate: DateTime.now(),
                                        );
                                        if (picked != null && mounted) {
                                          final dob = DateFormat('yyyy-MM-dd').format(picked);
                                          await ref
                                              .read(apiClientProvider)
                                              .dio
                                              .put(
                                                '/user/me',
                                                data: {'dateOfBirth': '${dob}T00:00:00.000Z'},
                                              );
                                          ref.read(userProfileProvider.notifier).loadProfile();
                                        }
                                      },
                                      child: Text(
                                        'Add',
                                        style: AppTypography.labelMedium.copyWith(
                                          color: context.colors.primaryAccent,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                          ],
                        ),

                        const SizedBox(height: 120),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),

          // Save Button
          Positioned(
            left: 24,
            right: 24,
            bottom: 32,
            child: AnimatedSlide(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutBack,
              offset: _isModified ? Offset.zero : const Offset(0, 2),
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 300),
                opacity: _isModified ? 1.0 : 0.0,
                child: GestureDetector(
                  onTap: _isLoading ? null : _saveChanges,
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      color: context.colors.primaryAccent,
                      boxShadow: [
                        BoxShadow(
                          color: context.colors.primaryAccent.withOpacity(0.4),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Center(
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator.adaptive(
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                strokeWidth: 3,
                              ),
                            )
                          : Text(
                              'Save Changes',
                              style: AppTypography.titleMedium.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
