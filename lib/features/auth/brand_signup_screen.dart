import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import 'screens/terms_screen.dart';
import 'widgets/terms_checkbox.dart';

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
  bool _termsAccepted = true;

  Timer? _otpTimer;
  List<String> _otpDigits = ['', '', '', '', '', ''];
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());

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
    for (var node in _otpFocusNodes) {
      node.dispose();
    }
    for (var ctrl in _otpControllers) {
      ctrl.dispose();
    }
    super.dispose();
  }

  void _startOtpTimer() {
    _otpTimer?.cancel();
    _otpTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final notifier = ref.read(brandSignupProvider.notifier);
      final current = ref.read(brandSignupProvider).otpCooldown;
      if (current > 0) {
        notifier.setOtpCooldown(current - 1);
      } else {
        timer.cancel();
      }
    });
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
    if (step == 1 && !state.isEmailVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please verify your email first'),
          backgroundColor: context.colors.error,
        ),
      );
      return;
    }
    if (step < 3) _goToStep(step + 1);
  }

  void _showTermsRequiredSnackbar() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Please accept the Terms & Conditions to continue'),
        backgroundColor: context.colors.error,
      ),
    );
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
                  : state.currentStep == 3
                      ? (_termsAccepted ? _submit : _showTermsRequiredSnackbar)
                      : _nextStep,
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
    final state = ref.watch(brandSignupProvider);
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
              onChanged: (v) {
                notifier.updateField('brandEmail', v);
                notifier.resetEmailVerification();
              },
            ),
            const SizedBox(height: AppSpacing.md),
            if (state.isEmailVerified)
              Container(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm, horizontal: AppSpacing.md),
                decoration: BoxDecoration(
                  color: context.colors.success.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                ),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: context.colors.success, size: 20),
                    const SizedBox(width: AppSpacing.sm),
                    Text('Email verified', style: AppTypography.bodyMedium.copyWith(color: context.colors.success)),
                  ],
                ),
              )
            else if (!state.showOtpInput)
              SizedBox(
                width: double.infinity,
                height: 36,
                child: ElevatedButton(
                  onPressed: (_emailCtrl.text.isEmpty || Validators.email(_emailCtrl.text) != null)
                      ? null
                      : () async {
                          final success = await notifier.sendEmailOtp(_emailCtrl.text, 'signup');
                          if (success) {
                            _startOtpTimer();
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.colors.primaryAccent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusSm)),
                    padding: EdgeInsets.zero,
                  ),
                  child: state.isOtpSending
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Verify Email'),
                ),
              )
            else
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Enter the 6-digit code sent to your email', style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary)),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(6, (index) {
                      return Container(
                        width: 48,
                        margin: EdgeInsets.only(right: index < 5 ? 8.0 : 0),
                        child: RawKeyboardListener(
                          focusNode: FocusNode(),
                          onKey: (event) {
                            if (event is RawKeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
                              if (_otpDigits[index].isEmpty && index > 0) {
                                _otpFocusNodes[index - 1].requestFocus();
                              }
                            }
                          },
                          child: TextField(
                            controller: _otpControllers[index],
                            focusNode: _otpFocusNodes[index],
                            textAlign: TextAlign.center,
                            textAlignVertical: TextAlignVertical.center,
                            keyboardType: TextInputType.number,
                            maxLength: 1,
                            style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary),
                            decoration: InputDecoration(
                              counterText: '',
                              contentPadding: EdgeInsets.symmetric(vertical: 14),
                              filled: true,
                              fillColor: context.colors.surface,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: context.colors.borderLight),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: context.colors.borderLight),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: context.colors.primaryAccent),
                              ),
                            ),
                            onChanged: (val) {
                                setState(() {
                                  _otpDigits[index] = val;
                                });
                                if (val.isNotEmpty && index < 5) {
                                  _otpFocusNodes[index + 1].requestFocus();
                                } else if (val.isEmpty && index > 0) {
                                  _otpFocusNodes[index - 1].requestFocus();
                                }
                              
                              if (val.isNotEmpty && index == 5) {
                                final code = _otpDigits.join();
                                if (code.length == 6) {
                                  notifier.verifyEmailOtp(_emailCtrl.text, code);
                                }
                              }
                            },
                          ),
                        ),
                      );
                    }),
                  ),
                  if (state.otpError != null) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(state.otpError!, style: AppTypography.bodySmall.copyWith(color: context.colors.error)),
                  ],
                  if (state.isOtpVerifying) ...[
                    const SizedBox(height: AppSpacing.sm),
                    const Center(child: CircularProgressIndicator()),
                  ],
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: (state.otpCooldown > 0 || state.otpSendCount >= 3)
                            ? null
                            : () async {
                                final success = await notifier.sendEmailOtp(_emailCtrl.text, 'signup');
                                if (success) {
                                  setState(() {
                                    for (int i = 0; i < 6; i++) {
                                      _otpDigits[i] = '';
                                      _otpControllers[i].clear();
                                    }
                                    _otpFocusNodes[0].requestFocus();
                                  });
                                  _startOtpTimer();
                                }
                              },
                        child: Text(
                          state.otpCooldown > 0
                              ? 'Resend in ${state.otpCooldown}s'
                              : state.otpSendCount >= 3
                                  ? 'Max attempts reached'
                                  : 'Resend Code',
                          style: AppTypography.labelMedium.copyWith(
                            color: (state.otpCooldown > 0 || state.otpSendCount >= 3)
                                ? context.colors.textTertiary
                                : context.colors.primaryAccent,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
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
            const SizedBox(height: AppSpacing.xl),
            TermsCheckbox(
              accepted: _termsAccepted,
              onChanged: (v) => setState(() => _termsAccepted = v),
              termsType: TermsType.brand,
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}
