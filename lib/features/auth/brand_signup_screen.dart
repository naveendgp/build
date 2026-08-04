import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/lyket_button.dart';
import '../../core/widgets/lyket_text_field.dart';
import '../../core/widgets/lyket_progress.dart';
import '../../core/utils/validators.dart';
import 'providers/signup_provider.dart';
import 'providers/auth_provider.dart';
import 'widgets/password_strength_bar.dart';
import 'widgets/social_auth_button.dart';
import 'widgets/category_selector.dart';
import 'widgets/sub_category_selector.dart';
import '../../core/widgets/location_picker.dart';

import 'widgets/upload_area.dart';

class BrandSignupScreen extends ConsumerStatefulWidget {
  const BrandSignupScreen({super.key});
  @override
  ConsumerState<BrandSignupScreen> createState() => _BrandSignupScreenState();
}

class _BrandSignupScreenState extends ConsumerState<BrandSignupScreen> {
  final _pageCtrl = PageController();
  final _formKeys = List.generate(4, (_) => GlobalKey<FormState>());
  final _bizNameCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _gstCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _contactCtrl = TextEditingController(text: '+91 ');
  final _locationCtrl = TextEditingController();
  final _tagCtrl = TextEditingController();

  @override
  void dispose() {
    _pageCtrl.dispose();
    _bizNameCtrl.dispose();
    _usernameCtrl.dispose();
    _gstCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    _contactCtrl.dispose();
    _locationCtrl.dispose();
    _tagCtrl.dispose();
    super.dispose();
  }

  void _goToStep(int step) {
    _pageCtrl.animateToPage(step,
      duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
    ref.read(brandSignupProvider.notifier).setStep(step);
  }

  void _nextStep() {
    final state = ref.read(brandSignupProvider);
    final step = state.currentStep;
    if (!(_formKeys[step].currentState?.validate() ?? false)) return;
    if (step == 0 && state.businessCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please select a business category'),
          backgroundColor: context.colors.error,
        ),
      );
      return;
    }
    if (step < 3) _goToStep(step + 1);
  }

  Future<void> _submit() async {
    final success = await ref.read(brandSignupProvider.notifier).submitBrandSignup();
    if (success && mounted) {
      ref.read(authProvider.notifier).setLoggedInRole(UserRole.brand);
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(brandSignupProvider);
    final bottomPad = MediaQuery.of(context).padding.bottom;

    ref.listen<SignupState>(brandSignupProvider, (prev, next) {
      if (prev?.errorMessage != next.errorMessage && next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: context.colors.error,
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 22),
          onPressed: () {
            if (state.currentStep > 0) {
              _goToStep(state.currentStep - 1);
            } else {
              context.pop();
            }
          },
        ),
        title: Text('Brand Account', style: AppTypography.titleSmall.copyWith(color: context.colors.textPrimary)),
      ),
      body: Column(
        children: [
          const SizedBox(height: AppSpacing.md),
          LyketProgress(totalSteps: 4, currentStep: state.currentStep),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: PageView(
              controller: _pageCtrl,
              physics: const NeverScrollableScrollPhysics(),
              children: [_step1(), _step2(), _step3(), _step4()],
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              AppSpacing.lg, AppSpacing.md, AppSpacing.lg, bottomPad + AppSpacing.lg),
            child: LyketButton(
              label: state.currentStep == 3 ? 'Create Brand Account' : 'Next',
              isLoading: state.isLoading,
              onPressed: state.isLoading
                  ? null
                  : state.currentStep == 3 ? _submit : _nextStep,
            ),
          ),
        ],
      ),
    );
  }

  Widget _step1() {
    final notifier = ref.read(brandSignupProvider.notifier);
    final state = ref.watch(brandSignupProvider);
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Form(
        key: _formKeys[0],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Build Your Brand\nPresence', style: AppTypography.headlineLarge.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            Text('Start with your business basics', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
            const SizedBox(height: AppSpacing.xl),
            LyketTextField(
              label: 'Business Name',
              controller: _bizNameCtrl,
              validator: (v) => Validators.required(v, 'Business name'),
              onChanged: (v) => notifier.updateField('businessName', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketTextField(
              label: 'Username',
              controller: _usernameCtrl,
              validator: Validators.username,
              onChanged: (v) => notifier.updateField('brandUsername', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketTextField(
              label: 'GST Number',
              controller: _gstCtrl,
              onChanged: (v) => notifier.updateField('brandGstNumber', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketTextField(
              label: 'Contact Number',
              controller: _contactCtrl,
              keyboardType: TextInputType.phone,
              hint: '+91 98765 43210',
              validator: Validators.indianPhone,
              onChanged: (v) => notifier.updateField('brandContactNumber', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketTextField(
              label: 'Location',
              controller: _locationCtrl,
              readOnly: true,
              hint: 'City, State',
              validator: (v) => Validators.required(v, 'Location'),
              onTap: () async {
                final loc = await showLocationPicker(context);
                if (loc != null) {
                  _locationCtrl.text = loc;
                  notifier.updateField('brandLocation', loc);
                }
              },
            ),
            const SizedBox(height: AppSpacing.md),
            Text('Business Category', style: AppTypography.labelLarge.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            CategorySelector(
              selectedCategory: state.businessCategory,
              onSelect: (c) => notifier.setCategory(c),
            ),
            if (state.businessCategory != null) ...[
              const SizedBox(height: AppSpacing.md),
              Text('Sub-Category', style: AppTypography.labelLarge.copyWith(color: context.colors.textPrimary)),
              const SizedBox(height: AppSpacing.sm),
              SubCategorySelector(
                selectedCategory: state.businessCategory,
                selectedSubCategory: state.brandSubCategory,
                onSelect: (c) => notifier.setSubCategory(c),
              ),
            ],
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Widget _step2() {
    final notifier = ref.read(brandSignupProvider.notifier);
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Form(
        key: _formKeys[1],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Account Security', style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            Text('Set up your login credentials', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
            const SizedBox(height: AppSpacing.xl),
            LyketTextField(
              label: 'Email',
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              validator: Validators.email,
              onChanged: (v) => notifier.updateField('brandEmail', v),
            ),
            const SizedBox(height: AppSpacing.md),
            LyketPasswordField(
              label: 'Password',
              controller: _passwordCtrl,
              validator: Validators.password,
              textInputAction: TextInputAction.next,
              onChanged: (v) => notifier.updateField('brandPassword', v),
            ),
            PasswordStrengthBar(password: _passwordCtrl.text),
            const SizedBox(height: AppSpacing.md),
            LyketPasswordField(
              label: 'Confirm Password',
              controller: _confirmCtrl,
              validator: (v) => Validators.confirmPassword(v, _passwordCtrl.text),
              onChanged: (v) => notifier.updateField('brandConfirmPassword', v),
            ),
          ],
        ),
      ),
    );
  }

  Widget _step3() {
    final state = ref.watch(brandSignupProvider);
    final notifier = ref.read(brandSignupProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Form(
        key: _formKeys[2],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Brand Tags', style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary)),
                const SizedBox(width: AppSpacing.sm),
                GestureDetector(
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: context.colors.card,
                        title: Text('What are tags for?', style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary)),
                        content: Text(
                          'Tags help describe your brand with keywords (e.g. "vegan", "handmade", "sustainable"). '
                          'They make your brand easier to discover when users search or browse by interest.',
                          style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: Text('Got it', style: AppTypography.labelLarge.copyWith(color: context.colors.primaryAccent)),
                          ),
                        ],
                      ),
                    );
                  },
                  child: Icon(Icons.info_outline_rounded, size: 20, color: context.colors.textTertiary),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text('Add tags that describe your brand', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
            const SizedBox(height: AppSpacing.xl),
            
            Row(
              children: [
                Expanded(
                  child: LyketTextField(
                    label: 'Add a tag',
                    controller: _tagCtrl,
                    onSubmitted: (val) {
                      if (val.trim().isNotEmpty) {
                        notifier.addBrandTag(val);
                        _tagCtrl.clear();
                      }
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                IconButton(
                  onPressed: () {
                    if (_tagCtrl.text.trim().isNotEmpty) {
                      notifier.addBrandTag(_tagCtrl.text);
                      _tagCtrl.clear();
                    }
                  },
                  icon: const Icon(Icons.add_circle_outline),
                  color: context.colors.primaryAccent,
                  iconSize: 32,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: state.brandTags.map((tag) {
                return Chip(
                  label: Text(tag, style: AppTypography.bodySmall.copyWith(color: Colors.white)),
                  backgroundColor: context.colors.card,
                  deleteIconColor: context.colors.textSecondary,
                  onDeleted: () => notifier.removeBrandTag(tag),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    side: BorderSide(color: context.colors.borderLight),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _step4() {
    final state = ref.watch(brandSignupProvider);
    final notifier = ref.read(brandSignupProvider.notifier);
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Form(
        key: _formKeys[3],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Brand Assets', style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            Text('Upload your brand visuals', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
            const SizedBox(height: AppSpacing.xl),
            Text('Logo', style: AppTypography.labelLarge.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            Center(
              child: SizedBox(
                width: 120, height: 120,
                child: UploadArea(
                  label: 'Brand Logo',
                  isCircle: true,
                  imagePath: state.logoPath,
                  onImageSelected: (p) => notifier.setLogo(p),
                  onRemove: () => notifier.removeLogo(),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Cover Image (Optional)', style: AppTypography.labelLarge.copyWith(color: context.colors.textPrimary)),
            const SizedBox(height: AppSpacing.sm),
            UploadArea(
              label: 'Cover Image',
              imagePath: state.coverPath,
              onImageSelected: (p) => notifier.setCover(p),
              onRemove: () => notifier.removeCover(),
            ),
          ],
        ),
      ),
    );
  }
}
